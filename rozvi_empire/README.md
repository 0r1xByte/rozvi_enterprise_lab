# Rozvi Empire Cyber Lab

**Automated Detection and Penetration Testing Laboratory**

A fully automated, modular cyber security lab environment built with 100% open-source tooling for detection engineering, threat hunting, and penetration testing training.

> 🏛️ **NEW**: Deploy an Active Directory environment modeled after the **historical Rozvi Empire** (1684-1866)!
> Experience cybersecurity training with authentic African historical context.
> See [Rozvi Historical Deployment Guide](ROZVI_HISTORICAL_DEPLOYMENT.md) for details.

> 🐍 **NEW**: Modern Python application structure following latest 2024 standards!
> Type-safe configuration, beautiful CLI, comprehensive testing, and professional development tools.
> See [Python Project Structure Guide](PYTHON_PROJECT_STRUCTURE.md) for details.

> 📚 **DOCUMENTATION**: Comprehensive documentation now available with MkDocs!
> Run `mkdocs serve` to access searchable, interactive documentation locally.
> See [Documentation Guide](DOCUMENTATION_GUIDE.md) for details.

> 🚀 **QUICK START**: New to the lab? Check out the [Quick Start Guide](QUICK_START.md) to deploy in 5 steps!

## 🎯 Overview

This project provides a complete Infrastructure-as-Code (IaC) solution for deploying a sophisticated cyber security lab on Proxmox VE. The lab includes:

- **Defensive Tool Stack**: Security Onion, Elastic Stack, MISP, Wazuh, Velociraptor, Malcolm, FLARE-VM
- **Attack Infrastructure**: Kali Linux with comprehensive penetration testing tools
- **Target Environment**: Active Directory domain (intentionally vulnerable for testing)
- **Network Segmentation**: OPNsense firewall with isolated networks
- **Cloud Ready**: VPN infrastructure for future cloud integration

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         OPNsense Firewall                        │
│                         (10.0.1.1 - 10.0.30.1)                  │
└────┬──────────┬──────────┬──────────┬──────────────────────────┘
     │          │          │          │
     │          │          │          │
┌────▼─────┐ ┌─▼────────┐ ┌▼────────┐ ┌▼──────────────────────┐
│Management│ │Defensive │ │ Attack  │ │ Active Directory      │
│ Network  │ │ Network  │ │ Network │ │ Network               │
│10.0.1/24 │ │10.0.10/24│ │10.0.20/24│ │ 10.0.30/24           │
└──────────┘ └──────────┘ └─────────┘ └───────────────────────┘
              │                │              │
              │                │              │
         ┌────▼─────┐     ┌───▼───┐     ┌────▼─────┐
         │Sec Onion │     │ Kali  │     │   DC01   │
         │ Elastic  │     │ Linux │     │   WS1-3  │
         │  MISP    │     └───────┘     └──────────┘
         │  Wazuh   │
         │Velocirap.│
         │ Malcolm  │
         │ FLARE-VM │
         └──────────┘
```

## 🚀 Quick Start

### Prerequisites

1. **Proxmox VE 8.0+** installed and configured
2. **Python 3.10+** on your control machine
3. **UV** package manager installed
4. **Terraform 1.5+**
5. **Packer 1.9+**
6. **Ansible 8.0+**

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd rozvi_empire
```

2. **Install UV and dependencies**:
```bash
# Install UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install project dependencies
uv sync
```

3. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your Proxmox credentials and network settings
nano .env
```

4. **Download required ISOs** to Proxmox:
   - Windows Server 2016, 2019, 2022
   - Windows 10 Enterprise
   - Windows 11 Enterprise
   - Kali Linux 2024.3
   - OPNsense (latest)
   - VirtIO drivers for Windows

5. **Customize your lab** (NEW!):
```bash
# Edit lab_config.yaml to define your topology
nano lab_config.yaml

# View current configuration
uv run python lab_deploy.py show-config
```

6. **Deploy the lab**:
```bash
# NEW: Flexible deployment with YAML configuration
uv run python lab_deploy.py deploy

# Deploy with specific options
uv run python lab_deploy.py deploy --enable-exchange --enable-adcs --win10-count 10

# LEGACY: Original deployment script
uv run python lab_setup.py deploy

# Skip image building if templates already exist
uv run python lab_deploy.py deploy --skip-packer
```

## 📋 Deployment Phases

The orchestration script executes three phases:

### Phase 1: Image Building (Packer)
- Windows Server 2022 template
- Windows 10 Client template
- Kali Linux template

### Phase 2: Infrastructure Provisioning (Terraform)
- OPNsense firewall with 5 network interfaces
- Active Directory domain controller
- 3 Windows client workstations
- 7 defensive tool VMs
- 1 Kali Linux attack VM

### Phase 3: Configuration (Ansible)
- OPNsense network segmentation and firewall rules
- Active Directory deployment (intentionally vulnerable)
- Defensive tool stack installation and configuration
- Agent deployment (Wazuh, Velociraptor)
- Log forwarding to SIEM

## 🛠️ Components

### Defensive Tools

| Tool | Purpose | IP Address | Access |
|------|---------|------------|--------|
| Security Onion | Network Security Monitoring | 10.0.10.10 | https://10.0.10.10 |
| Elastic Stack | SIEM / Log Aggregation | 10.0.10.20 | https://10.0.10.20:5601 |
| MISP | Threat Intelligence | 10.0.10.30 | https://10.0.10.30 |
| Wazuh | EDR / HIDS | 10.0.10.40 | https://10.0.10.40 |
| Velociraptor | Endpoint Visibility | 10.0.10.50 | https://10.0.10.50:8889 |
| Malcolm | Network Traffic Analysis | 10.0.10.60 | https://10.0.10.60 |
| N8N SOAR | Security Orchestration & Automation | 10.0.10.70 | http://10.0.10.70:5678 |
| HashiCorp Vault | Secrets Management | 10.0.10.75 | http://10.0.10.75:8200 |
| FLARE-VM | Malware Analysis | 10.0.10.80 | RDP to 10.0.10.80 |

### Attack Tools

| Tool | Purpose | IP Address | Access |
|------|---------|------------|--------|
| Kali Linux | Penetration Testing | 10.0.20.10 | SSH to 10.0.20.10 |

### Target Environment

| System | Role | IP Address | Credentials |
|--------|------|------------|-------------|
| DC01 | Domain Controller | 10.0.30.10 | Administrator / [see .env] |
| WS1-3 | Windows Clients | 10.0.30.20-22 | Domain users |

## 🔧 Management Commands

### NEW: Flexible Deployment (lab_deploy.py)

```bash
# Deploy with custom configuration
uv run python lab_deploy.py deploy

# Deploy only Active Directory
uv run python lab_deploy.py deploy --only-ad --win10-count 5

# Deploy with Exchange and ADCS
uv run python lab_deploy.py deploy --enable-exchange --enable-adcs

# Enable Docker enterprise simulation
uv run python lab_deploy.py deploy --enable-docker

# View configuration
uv run python lab_deploy.py show-config

# Toggle components
uv run python lab_deploy.py toggle exchange --enable
uv run python lab_deploy.py toggle adcs --disable
```

### LEGACY: Original Deployment (lab_setup.py)

```bash
# Deploy full lab
uv run python lab_setup.py deploy

# Destroy lab
uv run python lab_setup.py destroy

# Run specific Ansible playbook
uv run python lab_setup.py configure site.yml --tags defensive

# Check lab status
uv run python lab_setup.py status
```

## 📚 Documentation

### 🌐 Interactive Documentation (NEW!)
**Comprehensive, searchable documentation with MkDocs Material theme**

```bash
# Install documentation dependencies
pip install -r docs-requirements.txt

# Serve documentation locally
mkdocs serve

# Access at http://localhost:8000
```

**Features**:
- 📖 60+ documentation pages covering all tools and hosts
- 🔍 Instant search functionality
- 🌓 Dark/light mode toggle
- 📊 Mermaid diagrams for architecture visualization
- 💻 Syntax-highlighted code examples
- 📱 Mobile-responsive design

**Documentation Includes**:
- **Why** each tool/host is configured (rationale, alternatives considered)
- **How** each component works (technical details, architecture)
- **Configuration** steps (installation, setup, integration)
- **Use cases** (practical examples, scenarios)
- **Troubleshooting** (common issues, solutions)

See [Documentation Guide](DOCUMENTATION_GUIDE.md) for complete details.

### Core Documentation
- [🏛️ Rozvi Historical Deployment](ROZVI_HISTORICAL_DEPLOYMENT.md) - **NEW!** Deploy AD based on Rozvi Empire history
- [Flexible Deployment Guide](FLEXIBLE_DEPLOYMENT_GUIDE.md) - **NEW!** Customizable VM provisioning
- [Quick Reference Card](QUICK_REFERENCE.md) - Command cheat sheet
- [Enhancements Summary](ENHANCEMENTS_SUMMARY.md) - New features overview
- [Network Architecture](docs/NETWORK_ARCHITECTURE.md) - Detailed network design and cloud integration
- [Defensive Tools Configuration](docs/DEFENSIVE_TOOLS_CONFIG.md) - Tool-specific setup guides
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Step-by-step deployment instructions
- [Cloud Integration](docs/CLOUD_INTEGRATION.md) - AWS/Azure/GCP connectivity

### SOAR & Secrets Management
- [🔐 N8N + Vault Complete Guide](docs/N8N_VAULT_COMPLETE_GUIDE.md) - **START HERE!** Complete SOAR setup
- [N8N SOAR Platform Guide](docs/N8N_SOAR_GUIDE.md) - Workflow automation for security operations
- [HashiCorp Vault Guide](docs/VAULT_SECRETS_MANAGEMENT.md) - Centralized secrets management
- [Git Workflow Integration](docs/GIT_WORKFLOW_VAULT_INTEGRATION.md) - CI/CD with Vault secrets

### Configuration Files
- `lab_config_rozvi_historical.yaml` - **NEW!** Historical Rozvi Empire configuration
- `lab_config.yaml` - Main lab topology configuration
- `lab_config_examples.yaml` - Example deployment scenarios
- `.env` - Environment variables and credentials
- `pyproject.toml` - Python dependencies (UV managed)

## 🔐 Security Considerations

### Hardened Components (Defensive Network)
- TLS encryption for all web interfaces
- SSH key-based authentication
- Firewall rules with default deny
- Regular security updates
- Fail2ban protection

### Intentionally Vulnerable (AD Network)
⚠️ **WARNING**: The Active Directory environment is INTENTIONALLY NOT HARDENED

- Weak passwords
- SMBv1 enabled
- LLMNR/NBT-NS enabled
- Windows Defender disabled
- Overly permissive shares
- Vulnerable service accounts

**DO NOT** expose this lab to the internet or untrusted networks!

## 🌐 Cloud Integration

The lab supports future integration with cloud environments via VPN:

### Supported Cloud Providers
- AWS (via WireGuard/OpenVPN to VPC)
- Azure (via OpenVPN to VNet)
- GCP (via WireGuard to VPC)

### Configuration
See [Network Architecture](docs/NETWORK_ARCHITECTURE.md) for detailed cloud integration setup.

## 🧪 Testing Scenarios

The lab supports various security testing scenarios:

1. **Detection Engineering**: Test SIEM rules against known attack patterns
2. **Threat Hunting**: Practice hunting techniques in a controlled environment
3. **Incident Response**: Simulate and respond to security incidents
4. **Red Team Operations**: Execute attack chains and measure detection
5. **Malware Analysis**: Analyze samples in isolated FLARE-VM environment

## 📊 MITRE ATT&CK Coverage

The lab provides detection coverage for:
- Initial Access (T1078, T1133, T1566)
- Execution (T1059, T1053, T1047)
- Persistence (T1136, T1543, T1547)
- Privilege Escalation (T1068, T1134, T1484)
- Defense Evasion (T1070, T1112, T1562)
- Credential Access (T1003, T1110, T1558)
- Discovery (T1087, T1018, T1069)
- Lateral Movement (T1021, T1550, T1563)
- Collection (T1005, T1039, T1056)
- Exfiltration (T1041, T1048, T1567)

## 📚 Documentation

### Quick Start
- **[Quick Start Guide](QUICK_START.md)** - Deploy the lab in 5 steps (2-4 hours)
- **[Project Complete Summary](PROJECT_COMPLETE_SUMMARY.md)** - Overview of all deliverables

### Python Development
- **[Python Project Structure](PYTHON_PROJECT_STRUCTURE.md)** - Modern Python standards guide (400+ lines)
- **[Modern Python Summary](MODERN_PYTHON_STRUCTURE_SUMMARY.md)** - Summary of Python structure

### Infrastructure & Security
- **[Vault Integration Guide](docs/secrets/vault-integration.md)** - HashiCorp Vault integration (350+ lines)
- **[N8N SOAR Guide](docs/N8N_SOAR_GUIDE.md)** - SOAR workflows and automation
- **[Proxmox Guide](docs/infrastructure/proxmox.md)** - Proxmox VE setup and integration (400+ lines)
- **[Security Onion Guide](docs/defensive/security-onion.md)** - NSM platform guide (450+ lines)

### MkDocs Documentation
- **[Documentation Guide](DOCUMENTATION_GUIDE.md)** - How to use MkDocs documentation (300+ lines)
- **[Documentation Quick Start](DOCUMENTATION_QUICK_START.md)** - Quick reference

**Serve Documentation Locally**:
```bash
mkdocs serve
# Open http://localhost:8000
```

### Historical Context
- **[Rozvi Historical Deployment](ROZVI_HISTORICAL_DEPLOYMENT.md)** - Historical AD structure

## 🤝 Contributing

Contributions are welcome! Please see CONTRIBUTING.md for guidelines.

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## ⚠️ Disclaimer

This lab environment is designed for educational and authorized security testing purposes only. Users are responsible for ensuring compliance with all applicable laws and regulations. The intentionally vulnerable components should never be exposed to production networks or the internet.

## 🙏 Acknowledgments

- Security Onion Solutions
- Elastic
- MISP Project
- Wazuh
- Velociraptor
- Malcolm (CISA)
- Mandiant FLARE Team
- Offensive Security (Kali Linux)
- OPNsense Project
- N8N (n8n.io)
- HashiCorp Vault

