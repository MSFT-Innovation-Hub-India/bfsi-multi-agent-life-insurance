"""
API Module for Life Insurance Underwriting System
=================================================

This module provides RESTful and WebSocket APIs for realtime
underwriting process showcase and agent output streaming.
"""

from .streaming_orchestrator import StreamingOrchestrator, AgentEvent
from .routes import router

__all__ = ['StreamingOrchestrator', 'AgentEvent', 'router']
