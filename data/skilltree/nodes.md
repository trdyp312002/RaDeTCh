---
trees:
  - id: "quant"
    label: "Data Oracle Path"
    color: "#60a5fa"
    icon: "🔮"
    nodes:
      - id: "python-basics"
        label: "Python Basics"
        status: "MASTERED"
        xp: 500
        requires: []
      - id: "pandas-numpy"
        label: "Pandas / NumPy"
        status: "MASTERED"
        xp: 600
        requires: ["python-basics"]
      - id: "statistics"
        label: "Statistics"
        status: "MASTERED"
        xp: 700
        requires: ["pandas-numpy"]
      - id: "econometrics"
        label: "Econometrics"
        status: "AVAILABLE"
        xp: 900
        requires: ["statistics"]
      - id: "ml-models"
        label: "ML Models"
        status: "LOCKED"
        xp: 1200
        requires: ["econometrics"]
      - id: "alpha-research"
        label: "Alpha Research"
        status: "LOCKED"
        xp: 1500
        requires: ["ml-models"]

  - id: "backend"
    label: "System Architect Path"
    color: "#c084fc"
    icon: "⚙️"
    nodes:
      - id: "rest-api"
        label: "REST API"
        status: "MASTERED"
        xp: 500
        requires: []
      - id: "websocket"
        label: "WebSocket"
        status: "MASTERED"
        xp: 700
        requires: ["rest-api"]
      - id: "ccxt"
        label: "CCXT Library"
        status: "MASTERED"
        xp: 600
        requires: ["rest-api"]
      - id: "asyncio"
        label: "asyncio"
        status: "AVAILABLE"
        xp: 800
        requires: ["websocket"]
      - id: "low-latency"
        label: "Low Latency"
        status: "LOCKED"
        xp: 1100
        requires: ["asyncio"]
      - id: "cpp"
        label: "C++ Execution"
        status: "LOCKED"
        xp: 2000
        requires: ["low-latency"]

  - id: "risk"
    label: "Guardian Path"
    color: "#fb923c"
    icon: "🛡️"
    nodes:
      - id: "position-sizing"
        label: "Position Sizing"
        status: "MASTERED"
        xp: 500
        requires: []
      - id: "stop-loss"
        label: "Stop-Loss Logic"
        status: "MASTERED"
        xp: 600
        requires: ["position-sizing"]
      - id: "var"
        label: "VaR / CVaR"
        status: "AVAILABLE"
        xp: 900
        requires: ["stop-loss"]
      - id: "kill-switch"
        label: "Kill Switch"
        status: "AVAILABLE"
        xp: 1000
        requires: ["stop-loss"]
      - id: "portfolio-theory"
        label: "Portfolio Theory"
        status: "LOCKED"
        xp: 1300
        requires: ["var"]

  - id: "devops"
    label: "Infrastructure Mage Path"
    color: "#34d399"
    icon: "🌐"
    nodes:
      - id: "linux"
        label: "Linux CLI"
        status: "MASTERED"
        xp: 400
        requires: []
      - id: "docker"
        label: "Docker"
        status: "MASTERED"
        xp: 600
        requires: ["linux"]
      - id: "cloud"
        label: "AWS / GCP"
        status: "AVAILABLE"
        xp: 800
        requires: ["docker"]
      - id: "monitoring"
        label: "Prometheus/Grafana"
        status: "AVAILABLE"
        xp: 700
        requires: ["docker"]
      - id: "kubernetes"
        label: "Kubernetes"
        status: "LOCKED"
        xp: 1400
        requires: ["cloud"]
      - id: "terraform"
        label: "Terraform (IaC)"
        status: "LOCKED"
        xp: 1200
        requires: ["kubernetes"]
---

# Skill Tree Data

Statuses: MASTERED | AVAILABLE | LOCKED
Update node status as team members level up their skills.
