
NFER Reading Builder
Version: 1.0
Status: MVP specification
1. Overview
NFER Reading Builder is a web application that generates Year 4 reading comprehension assessments inspired by UK primary school tests.
The system is designed for:
parents
tutors
teachers
The application must:
Generate weekly reading tests
Provide teacher marking guides
Provide model answers
Track pupil progress
Provide diagnostic feedback
Support adaptive difficulty
The system should be designed so that Years 2–6 can be added later.
The application must not reproduce copyrighted NFER content. All passages and questions must be original.
2. Target Users
Parents
Want structured reading practice for their child.
Tutors
Need printable reading assessments.
Teachers
Want diagnostics showing reading skill gaps.
3. Core Features
3.1 Passage Library
Store original reading passages tagged by:
year group
genre
topic
difficulty
word count
Genres:
fiction
nonfiction
Example topics:
exploration
animals
weather
inventions
space
history
nature
transport
mysteries
3.2 Question Library
Questions must be linked to passages.
Each question must include:
question type
difficulty
marks
skill tag
domain tag
model answers
marking notes
Question types:
multiple choice
short answer
evidence selection
ordering
4. Reading Skill Framework
Each question must be tagged with a domain and a fine skill.
Domains
Domain	Description
Retrieval	Find explicit information
Vocabulary	Understand word meaning
Inference	Read between the lines
Structure	Understand organisation
Author Intent	Understand writer purpose
Fine Skill Tags
Examples include:
Retrieval
scanning for facts
locating evidence
identifying stated information
Vocabulary
meaning in context
shades of meaning
pronoun reference
Inference
character feelings
motives
cause and effect
implied meaning
Structure
paragraph main idea
sequence of events
purpose of headings
Author Intent
tone
effect of language
writer viewpoint
prediction using evidence
5. Weekly Test Structure
Each generated test should contain:
2 passages
1 fiction
1 nonfiction
Passage length
Year	Words
Year 4	300–450
Questions
Total: 12
Recommended mix:
Domain	Questions
Retrieval	3
Vocabulary	2
Inference	4
Structure	1
Author intent	2
Marks
Total marks: ~20
6. Adaptive Difficulty
Difficulty scale: 1–5
Rules
If previous score ≥ 85%
→ increase difficulty
If score 70–84%
→ keep difficulty
If score 50–69%
→ keep passage difficulty but add scaffolding
If score < 50%
→ reduce difficulty
7. Diagnostic System
After marking a test the system must generate:
Overall results
total score
percentage
Domain breakdown
Example:
Domain	Result
Retrieval	3/3
Vocabulary	1/2
Inference	2/4
Structure	1/1
Author intent	2/2
Diagnostic summary
Include:
Strengths
Areas for improvement
Suggested next focus
Example:
Strength: Retrieval
Focus area: Inference

Suggested practice:
Ask the pupil to explain why characters behave in certain ways.
8. Teacher Marking Guide
For each test generate:
Mark scheme
Question	Skill	Marks	Acceptable answer
Model Answers
Each open question should include:
Gold answer (full marks)
Silver answer (partial marks)
Common wrong answer
9. Progress Tracking
Store results per pupil.
Tracked fields:
date
test number
score
percentage
time taken
difficulty level
Also store domain scores.
Tracker dashboard
Show:
score trend
skill trend
flagged weaknesses
Flag any domain scoring below 60%.
10. Content Requirements
Seed database with original content.
Minimum for MVP:
Passages
24 passages
Type	Count
Fiction	12
Nonfiction	12
Questions
Minimum:
160 questions
All must include:
skill tags
model answers
marking notes
11. Application Pages
Create the following pages:
Dashboard
Overview of progress.
Passage Library
Browse and filter passages.
Question Library
Browse questions.
Generate Test
Create a new assessment.
Test Preview
Show printable pupil test.
Teacher Guide
Show marking scheme.
Mark Results
Enter answers.
Diagnostic Report
Show analysis.
Progress Tracker
Visual progress history.
12. User Interface Requirements
The UI should be:
simple
teacher-friendly
printable
Design priorities:
readability
easy printing
minimal clutter
13. Technology Stack
Recommended stack:
Frontend
Next.js (App Router)
Language
TypeScript
Styling
Tailwind CSS
Database
SQLite
ORM
Prisma
Validation
Zod
Testing
Vitest or Jest
14. Repository Structure
Recommended structure:
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
Content files should be stored in /content as structured JSON or TypeScript modules.
15. Test Generator Logic
Algorithm:
Select fiction passage matching year and difficulty
Select nonfiction passage
Pull questions matching required skill distribution
Avoid duplicate fine skill tags where possible
Build test object
16. Sample Test Output
Generated test object:
{
  passages: [...],
  questions: [...],
  markScheme: [...],
  teacherGuide: [...]
}
17. Engineering Requirements
The repository must include:
seed script
generator logic
diagnostic engine
tracker logic
sample generated test
README with setup instructions
Code should be:
clean
modular
documented
18. Future Extensions
The system should support:
Years 2–6
Additional question types
AI passage generation
Bulk test generation
Export to PDF
Student accounts
Teacher dashboards
19. Success Criteria
The MVP is successful if a user can:
Generate a Year 4 test
Print the test
Mark answers
See a diagnostic report
Track progress over time
20. Non-Goals
The system will not:
copy NFER content
require login for MVP
support multiple schools initially
