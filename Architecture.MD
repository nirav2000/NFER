# System Architecture
Version 1.0

---

# Overview

The system consists of four main modules:

1. Content library
2. Test generator
3. Diagnostic engine
4. Progress tracker

---

# Repository Structure

/app
/components
/lib
/generator
/diagnostics
/content
/content/passages
/content/questions
/prisma
/tests

---

# Content Storage

Content files stored as JSON or TypeScript modules.

Example structure:

/content/passages/year4/fiction
/content/passages/year4/nonfiction
/content/questions/year4

---

# Passage Schema

{
  id,
  title,
  yearGroup,
  genre,
  topic,
  difficulty,
  wordCount,
  text
}

---

# Question Schema

{
  id,
  passageId,
  domain,
  fineSkillTag,
  difficulty,
  marks,
  questionType,
  stem,
  options,
  acceptedAnswers
}

---

# Test Generator

Steps:

1. Select fiction passage
2. Select nonfiction passage
3. Select questions by skill mix
4. Assemble test object

---

# Diagnostic Engine

Input:

- pupil answers
- question answer keys

Output:

- score
- percentage
- domain breakdown
- recommendations

---

# Adaptive Difficulty Engine

Uses previous test performance.

Algorithm:

score ≥ 85%  
increase difficulty

score 70–84%  
maintain difficulty

score 50–69%  
add scaffolded questions

score < 50%  
reduce difficulty

---

# Output Formats

The generator produces:

- pupil test
- answer key
- teacher guide
- diagnostic report
