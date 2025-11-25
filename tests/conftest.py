"""
Pytest configuration and shared fixtures for tests
"""

import pytest
import json
import os
from pathlib import Path


@pytest.fixture
def sample_applicant_data():
    """Load sample applicant data for testing"""
    fixture_path = Path(__file__).parent / "fixtures" / "test_critical_applicant.json"
    if fixture_path.exists():
        with open(fixture_path, 'r') as f:
            return json.load(f)
    return {}


@pytest.fixture
def sample_medical_data():
    """Load sample medical data for testing"""
    fixture_path = Path(__file__).parent / "fixtures" / "test_critical_medical.json"
    if fixture_path.exists():
        with open(fixture_path, 'r') as f:
            return json.load(f)
    return {}


@pytest.fixture
def temp_output_dir(tmp_path):
    """Create temporary output directory for tests"""
    output_dir = tmp_path / "test_outputs"
    output_dir.mkdir()
    return output_dir
