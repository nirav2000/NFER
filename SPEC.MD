# NFER Reading Builder
Version: 1.0  
Status: MVP Specification

## Overview
NFER Reading Builder is a web application that generates original reading comprehension assessments inspired by UK primary school tests.

The system will allow parents, tutors, and teachers to generate structured reading assessments and track reading development over time.

The system must NOT reproduce copyrighted NFER materials. All content must be original.

Initial focus is **Year 4**, but the architecture must support **Years 2–6**.

---

# Core Features

1. Passage library
2. Question library
3. Test generator
4. Teacher marking guide
5. Model answers
6. Diagnostic reports
7. Progress tracking
8. Adaptive difficulty

---

# Passage Library

Each passage contains metadata:

- id
- title
- yearGroup
- genre
- topic
- difficulty
- wordCount
- text
- tags

Genres:

- fiction
- nonfiction

Example topics:

- exploration
- animals
- weather
- inventions
- space
- history
- rivers
- nature
- transport

---

# Question Library

Questions must include:

- question id
- passageId
- questionType
- domain
- fineSkillTag
- difficulty
- marks
- stem
- options
- acceptedAnswers
- markingNotes
- modelAnswerGold
- modelAnswerSilver
- commonWrongAnswer

---

# Skill Domains

| Domain | Description |
|------|-------------|
Retrieval | locating stated information |
Vocabulary | understanding word meaning |
Inference | reading between the lines |
Structure | understanding organisation |
Author Intent | understanding writer choices |

---

# Weekly Test Structure

Each test includes:

- 2 passages
  - 1 fiction
  - 1 nonfiction

Word length target:

Year 4: 300–450 words

Total questions: **12**

Recommended mix:

- Retrieval: 3
- Vocabulary: 2
- Inference: 4
- Structure: 1
- Author intent: 2

Total marks: **≈20**

---

# Adaptive Difficulty

Difficulty scale: **1–5**

Rules:

If score ≥ 85%  
Increase difficulty

If score 70–84%  
Maintain difficulty

If score 50–69%  
Add scaffolded questions

If score < 50%  
Reduce difficulty

---

# Diagnostic Report

After marking a test the system generates:

- total score
- percentage
- domain breakdown
- strengths
- development areas
- next recommended focus

Example output:

Strength: Retrieval  
Focus area: Inference

Recommendation:
Practice explaining why characters act in certain ways.

---

# Progress Tracker

Store:

- date
- test number
- score
- percentage
- time taken
- difficulty level

Track domain scores and highlight any domain below **60%**.

---

# Content Requirements

Minimum for MVP:

Passages:
- 12 fiction
- 12 nonfiction

Questions:
- minimum 160

All questions must include marking guidance.

---

# Application Pages

Dashboard  
Passage Library  
Question Library  
Generate Test  
Test Preview  
Teacher Guide  
Mark Results  
Diagnostic Report  
Progress Tracker

---

# Technology Stack

Frontend: Next.js  
Language: TypeScript  
Styling: Tailwind CSS  
Database: SQLite  
ORM: Prisma  
Validation: Zod  
Testing: Vitest

---

# Success Criteria

A user must be able to:

1. Generate a test
2. Print it
3. Mark answers
4. See diagnostics
5. Track progress
