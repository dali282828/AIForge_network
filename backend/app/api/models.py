from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.user import User
from app.models.group import Group, GroupMembership, GroupRole
from app.models.model import Model, ModelLicense
from app.models.model_publishing import ModelPublishing, PublishingStatus
from app.schemas.model import (
    ModelCreate, ModelResponse, ModelUpdate, 
    ModelUploadResponse, HuggingFaceImport
)
from app.api.dependencies import get_current_user
from app.services.storage_service import storage_service
from app.core.ipfs import ipfs_client

router = APIRouter()

@router.post("/upload", response_model=ModelUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_model(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    version: str = Form("1.0.0"),
    group_id: int = Form(...),
    license: ModelLicense = Form(ModelLicense.OPEN),
    license_text: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    is_encrypted: bool = Form(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a model file to IPFS and MinIO"""
    
    # Verify group access
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if user is member of group
    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == current_user.id
    ).first()
    
    if not membership or membership.role == GroupRole.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to upload models to this group"
        )
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    file_format = file.filename.split('.')[-1] if '.' in file.filename else None
    
    # Upload to storage (hybrid: MinIO + IPFS)
    try:
        storage_result = storage_service.upload_hybrid(
            file_content,
            use_ipfs=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )
    
    # Pin to IPFS if CID exists
    ipfs_pinned = False
    if storage_result.get('ipfs_cid'):
        try:
            ipfs_client.pin(storage_result['ipfs_cid'])
            ipfs_pinned = True
        except Exception as e:
            print(f"Warning: Failed to pin IPFS content: {e}")
    
    # Create model record
    db_model = Model(
        name=name,
        description=description,
        version=version,
        group_id=group_id,
        owner_id=current_user.id,
        ipfs_cid=storage_result.get('ipfs_cid'),
        minio_path=storage_result.get('minio_path'),
        file_size=file_size,
        file_format=file_format,
        license=license,
        license_text=license_text,
        tags=tags,
        is_encrypted=is_encrypted,
        source="upload"
    )
    
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    
    # Build response
    model_response = ModelResponse(
        **db_model.__dict__,
        ipfs_gateway_url=ipfs_client.get_gateway_url(storage_result['ipfs_cid']) if storage_result.get('ipfs_cid') else None
    )
    
    return ModelUploadResponse(
        model=model_response,
        upload_status="success",
        ipfs_pinned=ipfs_pinned,
        message="Model uploaded successfully"
    )

@router.get("/groups/{group_id}/models", response_model=List[ModelResponse])
async def list_group_models(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """List all models in a group"""
    
    # Verify group access
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check access
    if not group.is_public:
        membership = db.query(GroupMembership).filter(
            GroupMembership.group_id == group_id,
            GroupMembership.user_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this group"
            )
    
    # Get models
    models = db.query(Model).filter(
        Model.group_id == group_id
    ).offset(skip).limit(limit).all()
    
    # Build response with gateway URLs
    result = []
    for model in models:
        model_dict = model.__dict__.copy()
        if model.ipfs_cid:
            model_dict['ipfs_gateway_url'] = ipfs_client.get_gateway_url(model.ipfs_cid)
        result.append(ModelResponse(**model_dict))
    
    return result

@router.get("/{model_id}", response_model=ModelResponse)
async def get_model(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get model details"""
    
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    # Check group access
    group = db.query(Group).filter(Group.id == model.group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    if not group.is_public:
        membership = db.query(GroupMembership).filter(
            GroupMembership.group_id == model.group_id,
            GroupMembership.user_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this group"
            )
    
    model_dict = model.__dict__.copy()
    if model.ipfs_cid:
        model_dict['ipfs_gateway_url'] = ipfs_client.get_gateway_url(model.ipfs_cid)
    
    return ModelResponse(**model_dict)

@router.put("/{model_id}", response_model=ModelResponse)
async def update_model(
    model_id: int,
    model_data: ModelUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update model metadata"""
    
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    # Check permissions: owner or admin
    if model.owner_id != current_user.id:
        membership = db.query(GroupMembership).filter(
            GroupMembership.group_id == model.group_id,
            GroupMembership.user_id == current_user.id
        ).first()
        if not membership or membership.role not in [GroupRole.OWNER, GroupRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owners and admins can update models"
            )
    
    # Update fields
    update_data = model_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(model, field, value)
    
    db.commit()
    db.refresh(model)
    
    model_dict = model.__dict__.copy()
    if model.ipfs_cid:
        model_dict['ipfs_gateway_url'] = ipfs_client.get_gateway_url(model.ipfs_cid)
    
    return ModelResponse(**model_dict)

@router.delete("/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_model(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a model"""
    
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    # Check permissions: owner or admin
    if model.owner_id != current_user.id:
        membership = db.query(GroupMembership).filter(
            GroupMembership.group_id == model.group_id,
            GroupMembership.user_id == current_user.id
        ).first()
        if not membership or membership.role not in [GroupRole.OWNER, GroupRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owners and admins can delete models"
            )
    
    # Unpin from IPFS if exists
    if model.ipfs_cid:
        try:
            ipfs_client.unpin(model.ipfs_cid)
        except Exception as e:
            print(f"Warning: Failed to unpin IPFS content: {e}")
    
    db.delete(model)
    db.commit()
    return None

@router.post("/import/huggingface", response_model=ModelUploadResponse, status_code=status.HTTP_201_CREATED)
async def import_from_huggingface(
    import_data: HuggingFaceImport,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import a model from HuggingFace"""
    
    # Verify group access
    group = db.query(Group).filter(Group.id == import_data.group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check permissions
    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == import_data.group_id,
        GroupMembership.user_id == current_user.id
    ).first()
    
    if not membership or membership.role == GroupRole.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to import models to this group"
        )
    
    try:
        # Try to import HuggingFace hub
        try:
            from huggingface_hub import hf_hub_download, snapshot_download
        except ImportError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="huggingface_hub library not installed. Install it with: pip install huggingface_hub"
            )
        
        import requests
        
        model_id = import_data.model_id
        revision = import_data.revision or "main"
        
        # Download model files
        if import_data.files:
            # Download specific files
            downloaded_files = []
            for file_name in import_data.files:
                file_path = hf_hub_download(
                    repo_id=model_id,
                    filename=file_name,
                    revision=revision
                )
                downloaded_files.append(file_path)
        else:
            # Download entire model
            model_path = snapshot_download(
                repo_id=model_id,
                revision=revision
            )
            # Get all files in the directory
            import os
            downloaded_files = []
            for root, dirs, files in os.walk(model_path):
                for file in files:
                    downloaded_files.append(os.path.join(root, file))
        
        # Upload to IPFS and MinIO
        # For now, we'll upload the first file or create a tar archive
        # In production, you might want to handle multiple files differently
        if downloaded_files:
            with open(downloaded_files[0], 'rb') as f:
                file_content = f.read()
            
            storage_result = storage_service.upload_hybrid(
                file_content,
                use_ipfs=True
            )
            
            # Pin to IPFS
            ipfs_pinned = False
            if storage_result.get('ipfs_cid'):
                try:
                    ipfs_client.pin(storage_result['ipfs_cid'])
                    ipfs_pinned = True
                except Exception as e:
                    print(f"Warning: Failed to pin IPFS content: {e}")
            
            # Get model info from HuggingFace
            try:
                api_url = f"https://huggingface.co/api/models/{model_id}"
                hf_response = requests.get(api_url, timeout=10)
                hf_data = hf_response.json() if hf_response.status_code == 200 else {}
            except:
                hf_data = {}
            
            # Create model record
            db_model = Model(
                name=import_data.model_id.split('/')[-1],
                description=hf_data.get('safetensors', {}).get('description') or f"Imported from HuggingFace: {model_id}",
                version=revision,
                group_id=import_data.group_id,
                owner_id=current_user.id,
                ipfs_cid=storage_result.get('ipfs_cid'),
                minio_path=storage_result.get('minio_path'),
                file_size=len(file_content),
                file_format=downloaded_files[0].split('.')[-1] if '.' in downloaded_files[0] else None,
                license=ModelLicense.OPEN,  # Default, can be updated
                source="huggingface",
                source_url=f"https://huggingface.co/{model_id}"
            )
            
            db.add(db_model)
            db.commit()
            db.refresh(db_model)
            
            model_response = ModelResponse(
                **db_model.__dict__,
                ipfs_gateway_url=ipfs_client.get_gateway_url(storage_result['ipfs_cid']) if storage_result.get('ipfs_cid') else None
            )
            
            return ModelUploadResponse(
                model=model_response,
                upload_status="success",
                ipfs_pinned=ipfs_pinned,
                message=f"Model imported from HuggingFace: {model_id}"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No files found to import"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import from HuggingFace: {str(e)}"
        )

@router.get("/published")
async def get_published_models(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all published models from groups (public endpoint, but better with auth)"""
    from datetime import datetime
    
    # Get all published models
    published_models = db.query(Model).join(
        ModelPublishing, Model.id == ModelPublishing.model_id
    ).filter(
        ModelPublishing.status == PublishingStatus.PUBLISHED,
        ModelPublishing.listing_fee_paid_until > datetime.utcnow()  # Not expired
    ).offset(skip).limit(limit).all()
    
    # Build response with gateway URLs and group info
    result = []
    for model in published_models:
        model_dict = {
            'id': model.id,
            'name': model.name,
            'description': model.description,
            'version': model.version,
            'license': model.license.value if model.license else None,
            'license_text': model.license_text,
            'tags': model.tags,
            'source': model.source,
            'source_url': model.source_url,
            'group_id': model.group_id,
            'owner_id': model.owner_id,
            'ipfs_cid': model.ipfs_cid,
            'ipfs_gateway_url': ipfs_client.get_gateway_url(model.ipfs_cid) if model.ipfs_cid else None,
            'minio_path': model.minio_path,
            'file_size': model.file_size,
            'file_format': model.file_format,
            'is_encrypted': model.is_encrypted,
            'created_at': model.created_at.isoformat() if model.created_at else None,
            'updated_at': model.updated_at.isoformat() if model.updated_at else None,
        }
        
        # Add group info
        group = db.query(Group).filter(Group.id == model.group_id).first()
        if group:
            model_dict['group_name'] = group.name
            model_dict['group_is_public'] = group.is_public
        
        result.append(model_dict)
    
    return result

