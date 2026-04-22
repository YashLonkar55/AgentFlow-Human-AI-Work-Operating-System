# 🚀 AgentFlow – Human + AI Work Operating System

## 📌 Overview
AgentFlow is a modern web application that enables seamless **human + AI collaboration** for executing complex tasks.  
It allows users to input a goal, automatically breaks it into actionable steps using AI, executes them with real-time visibility, and lets users intervene, edit, and control the workflow.

This project demonstrates:
- AI agent systems
- Human-in-the-loop workflows
- Real-time execution tracking
- Product + engineering thinking

---

## 🎯 Goal
Build a production-quality system where:
- AI plans tasks
- AI executes tasks
- Humans supervise, edit, and guide execution
- Everything is visible, editable, and interactive

---

## 🧠 Core Concept

> “AI does the work, Human stays in control”

---

## ✨ Core Features

### 1. 🧾 Task Input Interface
- Clean input box (like ChatGPT / Notion)
- User enters a goal:
  - Example: “Analyze this dataset and give insights”
- Supports:
  - Text input
  - (Optional later) file upload

---

### 2. 🧠 AI Task Planner
- Converts user input → structured steps

#### Example Output:
```json
[
  { "id": 1, "title": "Fetch dataset", "status": "pending" },
  { "id": 2, "title": "Analyze data", "status": "pending" },
  { "id": 3, "title": "Generate summary", "status": "pending" }
]

