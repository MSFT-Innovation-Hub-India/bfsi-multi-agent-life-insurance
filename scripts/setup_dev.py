#!/usr/bin/env python3
"""
Quick installation script for development setup
"""

import subprocess
import sys
import os
from pathlib import Path


def main():
    """Set up development environment"""
    
    print("🚀 Setting up Life Insurance Underwriting System")
    print("=" * 60)
    
    # Check Python version
    if sys.version_info < (3, 9):
        print("❌ Error: Python 3.9 or higher is required")
        sys.exit(1)
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    
    # Check for .env file
    if not Path('.env').exists():
        if Path('.env.example').exists():
            print("⚠️  .env file not found. Creating from .env.example...")
            import shutil
            shutil.copy('.env.example', '.env')
            print("✅ Created .env file - please update with your credentials")
        else:
            print("⚠️  Warning: .env.example not found")
    else:
        print("✅ .env file exists")
    
    # Install dependencies
    print("\n📦 Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError:
        print("❌ Error installing dependencies")
        sys.exit(1)
    
    # Install package in development mode
    print("\n📦 Installing package in development mode...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-e", "."])
        print("✅ Package installed in development mode")
    except subprocess.CalledProcessError:
        print("⚠️  Warning: Could not install in development mode")
    
    # Create necessary directories
    print("\n📁 Creating output directories...")
    directories = ['outputs/reports', 'outputs/logs', 'outputs/processed', 'models']
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
    print("✅ Directories created")
    
    # Validate configuration
    print("\n🔧 Validating configuration...")
    try:
        from config import Config
        Config.validate()
        print("✅ Configuration valid")
    except Exception as e:
        print(f"⚠️  Configuration warning: {e}")
        print("💡 Please update your .env file with valid Azure OpenAI credentials")
    
    print("\n" + "=" * 60)
    print("🎉 Setup complete!")
    print("\n📚 Next steps:")
    print("  1. Update .env file with your Azure OpenAI credentials")
    print("  2. Run: python quick_start.py")
    print("  3. Or: python -m pytest tests/")
    print("\n📖 See README.md for detailed documentation")


if __name__ == "__main__":
    main()
