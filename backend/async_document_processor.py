#!/usr/bin/env python3
"""
Async Document Processing Engine for Askelio
High-performance async processing with background tasks and real-time progress updates
"""

import asyncio
import logging
import time
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass
from enum import Enum
import json
from pathlib import Path

# Import existing components
from unified_document_processor import (
    UnifiedDocumentProcessor, ProcessingOptions, ProcessingResult, 
    DocumentType, ProcessingMode
)

logger = logging.getLogger(__name__)

class ProcessingStatus(Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class AsyncProcessingTask:
    """Represents an async document processing task"""
    task_id: str
    file_path: str
    filename: str
    options: ProcessingOptions
    status: ProcessingStatus = ProcessingStatus.QUEUED
    progress: float = 0.0
    result: Optional[ProcessingResult] = None
    error_message: Optional[str] = None
    created_at: float = 0.0
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    
    def __post_init__(self):
        if self.created_at == 0.0:
            self.created_at = time.time()

class AsyncDocumentProcessor:
    """
    Async document processor with background task management
    Provides real-time progress updates and concurrent processing
    """
    
    def __init__(self, max_concurrent_tasks: int = 5):
        self.max_concurrent_tasks = max_concurrent_tasks
        self.active_tasks: Dict[str, AsyncProcessingTask] = {}
        self.task_queue: asyncio.Queue = asyncio.Queue()
        self.progress_callbacks: Dict[str, List[Callable]] = {}
        self.processor = UnifiedDocumentProcessor()
        self._worker_tasks: List[asyncio.Task] = []
        self._shutdown_event = asyncio.Event()
        
        logger.info(f"🚀 Async Document Processor initialized (max_concurrent: {max_concurrent_tasks})")
    
    async def start_workers(self):
        """Start background worker tasks"""
        for i in range(self.max_concurrent_tasks):
            worker_task = asyncio.create_task(self._worker(f"worker-{i}"))
            self._worker_tasks.append(worker_task)
        
        logger.info(f"✅ Started {self.max_concurrent_tasks} async workers")
    
    async def stop_workers(self):
        """Stop all background workers"""
        self._shutdown_event.set()
        
        # Cancel all worker tasks
        for task in self._worker_tasks:
            task.cancel()
        
        # Wait for workers to finish
        await asyncio.gather(*self._worker_tasks, return_exceptions=True)
        self._worker_tasks.clear()
        
        logger.info("🛑 All async workers stopped")
    
    async def submit_task(self, file_path: str, filename: str, 
                         options: ProcessingOptions, task_id: Optional[str] = None) -> str:
        """Submit a document processing task"""
        if task_id is None:
            task_id = f"task_{int(time.time() * 1000)}_{hash(file_path) % 10000}"
        
        task = AsyncProcessingTask(
            task_id=task_id,
            file_path=file_path,
            filename=filename,
            options=options
        )
        
        self.active_tasks[task_id] = task
        await self.task_queue.put(task)
        
        logger.info(f"📝 Task submitted: {task_id} ({filename})")
        return task_id
    
    async def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of a processing task"""
        task = self.active_tasks.get(task_id)
        if not task:
            return None
        
        return {
            "task_id": task.task_id,
            "filename": task.filename,
            "status": task.status.value,
            "progress": task.progress,
            "created_at": task.created_at,
            "started_at": task.started_at,
            "completed_at": task.completed_at,
            "error_message": task.error_message,
            "result": task.result.__dict__ if task.result else None
        }
    
    async def get_all_tasks(self) -> List[Dict[str, Any]]:
        """Get status of all active tasks"""
        tasks = []
        for task_id in self.active_tasks:
            task_status = await self.get_task_status(task_id)
            if task_status:
                tasks.append(task_status)
        return tasks
    
    async def cancel_task(self, task_id: str) -> bool:
        """Cancel a processing task"""
        task = self.active_tasks.get(task_id)
        if not task:
            return False
        
        if task.status in [ProcessingStatus.COMPLETED, ProcessingStatus.FAILED]:
            return False
        
        task.status = ProcessingStatus.CANCELLED
        task.error_message = "Task cancelled by user"
        task.completed_at = time.time()
        
        await self._notify_progress(task_id, 100.0, "Task cancelled")
        logger.info(f"❌ Task cancelled: {task_id}")
        return True
    
    def add_progress_callback(self, task_id: str, callback: Callable):
        """Add a progress callback for a specific task"""
        if task_id not in self.progress_callbacks:
            self.progress_callbacks[task_id] = []
        self.progress_callbacks[task_id].append(callback)
    
    async def _worker(self, worker_name: str):
        """Background worker that processes tasks from the queue"""
        logger.info(f"🔄 Worker {worker_name} started")
        
        while not self._shutdown_event.is_set():
            try:
                # Wait for a task with timeout
                task = await asyncio.wait_for(
                    self.task_queue.get(), 
                    timeout=1.0
                )
                
                if task.status == ProcessingStatus.CANCELLED:
                    continue
                
                await self._process_task(task, worker_name)
                
            except asyncio.TimeoutError:
                # No task available, continue waiting
                continue
            except Exception as e:
                logger.error(f"❌ Worker {worker_name} error: {e}")
                await asyncio.sleep(1)
        
        logger.info(f"🛑 Worker {worker_name} stopped")
    
    async def _process_task(self, task: AsyncProcessingTask, worker_name: str):
        """Process a single document task"""
        task_id = task.task_id
        
        try:
            logger.info(f"🔄 {worker_name} processing: {task_id} ({task.filename})")
            
            # Update task status
            task.status = ProcessingStatus.PROCESSING
            task.started_at = time.time()
            await self._notify_progress(task_id, 10.0, "Starting document processing")
            
            # Step 1: Document classification (20%)
            await self._notify_progress(task_id, 20.0, "Classifying document type")
            await asyncio.sleep(0.1)  # Yield control
            
            # Step 2: OCR Processing (50%)
            await self._notify_progress(task_id, 50.0, "Extracting text with OCR")
            
            # Run the actual processing in a thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, 
                self.processor.process_document,
                task.file_path,
                task.filename,
                task.options
            )
            
            # Step 3: LLM Processing (80%)
            await self._notify_progress(task_id, 80.0, "Processing with AI models")
            await asyncio.sleep(0.1)  # Yield control
            
            # Step 4: Completion (100%)
            task.result = result
            task.status = ProcessingStatus.COMPLETED
            task.completed_at = time.time()
            task.progress = 100.0
            
            processing_time = task.completed_at - task.started_at
            
            if result.success:
                await self._notify_progress(
                    task_id, 100.0, 
                    f"Processing completed successfully in {processing_time:.2f}s"
                )
                logger.info(f"✅ {worker_name} completed: {task_id} in {processing_time:.2f}s")
            else:
                task.status = ProcessingStatus.FAILED
                task.error_message = result.error_message or "Processing failed"
                await self._notify_progress(task_id, 100.0, f"Processing failed: {task.error_message}")
                logger.error(f"❌ {worker_name} failed: {task_id} - {task.error_message}")
            
        except Exception as e:
            task.status = ProcessingStatus.FAILED
            task.error_message = str(e)
            task.completed_at = time.time()
            task.progress = 100.0
            
            await self._notify_progress(task_id, 100.0, f"Processing error: {str(e)}")
            logger.error(f"❌ {worker_name} error processing {task_id}: {e}")
    
    async def _notify_progress(self, task_id: str, progress: float, message: str):
        """Notify progress callbacks"""
        task = self.active_tasks.get(task_id)
        if task:
            task.progress = progress
        
        # Call registered callbacks
        callbacks = self.progress_callbacks.get(task_id, [])
        for callback in callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(task_id, progress, message)
                else:
                    callback(task_id, progress, message)
            except Exception as e:
                logger.warning(f"Progress callback error: {e}")
    
    async def cleanup_completed_tasks(self, max_age_hours: int = 24):
        """Clean up old completed tasks"""
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        tasks_to_remove = []
        for task_id, task in self.active_tasks.items():
            if (task.status in [ProcessingStatus.COMPLETED, ProcessingStatus.FAILED, ProcessingStatus.CANCELLED] 
                and task.completed_at 
                and current_time - task.completed_at > max_age_seconds):
                tasks_to_remove.append(task_id)
        
        for task_id in tasks_to_remove:
            del self.active_tasks[task_id]
            if task_id in self.progress_callbacks:
                del self.progress_callbacks[task_id]
        
        if tasks_to_remove:
            logger.info(f"🧹 Cleaned up {len(tasks_to_remove)} old tasks")

# Global async processor instance
async_processor = AsyncDocumentProcessor()
