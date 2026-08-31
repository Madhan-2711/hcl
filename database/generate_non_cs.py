import json

skills = [
    # Medical & Healthcare
    "Anatomy", "Physiology", "Pharmacology", "Medical Ethics", "Patient Care", "Surgery Basics", 
    # Engineering
    "Structural Analysis", "AutoCAD", "Thermodynamics", "Fluid Mechanics", "Materials Science", "Project Management",
    # Law & Legal
    "Constitutional Law", "Criminal Law", "Contract Law", "Legal Research", "Negotiation", "Corporate Law",
    # Psychology & Social Sciences
    "Cognitive Psychology", "Clinical Psychology", "Behavioral Analysis", "Counseling", "Research Methods",
    # Forensics
    "Crime Scene Investigation", "Forensic Pathology", "DNA Analysis", "Fingerprint Analysis", "Criminalistics",
    # Modern / 2K Gen Demands
    "Digital Marketing", "Content Creation", "SEO", "Social Media Strategy", "Video Editing", "Copywriting",
    "Personal Finance", "Investing", "Entrepreneurship"
]

courses = [
    # Medical
    {"title": "Introduction to Human Anatomy", "desc": "Foundational knowledge of human body structures and systems.", "diff": "beginner", "hours": 20, "skills": ["Anatomy", "Physiology"]},
    {"title": "Medical Ethics & Patient Care", "desc": "Understanding the ethical principles of modern healthcare.", "diff": "intermediate", "hours": 15, "skills": ["Medical Ethics", "Patient Care"]},
    {"title": "Basic Pharmacology", "desc": "Study of drugs, their mechanisms, and therapeutic uses.", "diff": "intermediate", "hours": 25, "skills": ["Pharmacology"]},
    
    # Civil & Mechanical
    {"title": "Structural Engineering Basics", "desc": "Fundamentals of designing and analyzing physical structures.", "diff": "beginner", "hours": 30, "skills": ["Structural Analysis", "Materials Science"]},
    {"title": "AutoCAD for Engineers", "desc": "Master computer-aided design for civil and mechanical projects.", "diff": "intermediate", "hours": 40, "skills": ["AutoCAD", "Project Management"]},
    {"title": "Thermodynamics & Fluid Mechanics", "desc": "Core principles of energy, heat transfer, and fluid dynamics.", "diff": "advanced", "hours": 35, "skills": ["Thermodynamics", "Fluid Mechanics"]},
    
    # Law
    {"title": "Foundations of Criminal Law", "desc": "Explore the legal principles governing criminal offenses.", "diff": "beginner", "hours": 25, "skills": ["Criminal Law", "Legal Research"]},
    {"title": "Contract Negotiation & Drafting", "desc": "Learn to draft, review, and negotiate binding legal agreements.", "diff": "intermediate", "hours": 20, "skills": ["Contract Law", "Negotiation", "Corporate Law"]},
    
    # Psychology
    {"title": "Introduction to Cognitive Psychology", "desc": "Study of mental processes such as attention, language, and memory.", "diff": "beginner", "hours": 20, "skills": ["Cognitive Psychology", "Research Methods"]},
    {"title": "Clinical Counseling Techniques", "desc": "Practical skills for therapeutic intervention and behavioral analysis.", "diff": "advanced", "hours": 30, "skills": ["Clinical Psychology", "Counseling", "Behavioral Analysis"]},
    
    # Forensics
    {"title": "Crime Scene Investigation", "desc": "Techniques for securing, documenting, and collecting evidence.", "diff": "beginner", "hours": 25, "skills": ["Crime Scene Investigation", "Criminalistics"]},
    {"title": "Forensic Biology & DNA Analysis", "desc": "Applying biological sciences to legal investigations.", "diff": "advanced", "hours": 35, "skills": ["Forensic Pathology", "DNA Analysis"]},
    
    # Modern / Creator Economy
    {"title": "Digital Marketing Masterclass", "desc": "Comprehensive guide to SEO, social media, and online growth.", "diff": "beginner", "hours": 40, "skills": ["Digital Marketing", "SEO", "Social Media Strategy"]},
    {"title": "Content Creation & Video Editing", "desc": "Build an audience through compelling storytelling and video production.", "diff": "intermediate", "hours": 30, "skills": ["Content Creation", "Video Editing", "Copywriting"]},
    
    # Business / Finance
    {"title": "Personal Finance & Investing", "desc": "Master wealth building, budgeting, and stock market fundamentals.", "diff": "beginner", "hours": 15, "skills": ["Personal Finance", "Investing"]},
    {"title": "Modern Entrepreneurship", "desc": "From ideation to launch: building a startup in the 21st century.", "diff": "intermediate", "hours": 25, "skills": ["Entrepreneurship", "Project Management"]}
]

sql = "-- Seed V5: Non-CS Skills (Medical, Law, Civil/Mechanical, Forensics, Modern Creator)\n\n"

sql += "INSERT INTO skills (name) VALUES\n"
sql += ",\n".join([f"  ('{s}')" for s in skills])
sql += "\nON CONFLICT (name) DO NOTHING;\n\n"

sql += "INSERT INTO courses (title, description, difficulty, duration_hours) VALUES\n"
course_vals = []
for c in courses:
    t = c["title"].replace("'", "''")
    d = c["desc"].replace("'", "''")
    course_vals.append(f"  ('{t}', '{d}', '{c['diff']}', {c['hours']})")
sql += ",\n".join(course_vals)
sql += ";\n\n"

sql += "INSERT INTO course_skills (course_id, skill_id, is_prerequisite) VALUES\n"
cs_vals = []
for c in courses:
    t = c["title"].replace("'", "''")
    for idx, s in enumerate(c["skills"]):
        is_prereq = "true" if idx == 0 and len(c["skills"]) > 1 else "false"
        cs_vals.append(f"  ((SELECT id FROM courses WHERE title='{t}'), (SELECT id FROM skills WHERE name='{s}'), {is_prereq})")
sql += ",\n".join(cs_vals)
sql += "\nON CONFLICT DO NOTHING;\n"

with open("database/seed_v5.sql", "w", encoding="utf-8") as f:
    f.write(sql)
