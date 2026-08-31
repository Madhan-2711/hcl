import sys

skills = [
    'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'AWS', 'GCP', 'Azure',
    'Unity', 'C#', 'Unreal Engine', 'C++', '3D Modeling', 'Game Design',
    'Swift', 'iOS Development', 'Kotlin', 'Android Development', 'React Native', 'Flutter',
    'Blockchain', 'Solidity', 'Smart Contracts', 'Cryptography', 'Web3',
    'Figma', 'User Research', 'Wireframing', 'Prototyping', 'Accessibility',
    'Automated Testing', 'Selenium', 'Cypress', 'Jest', 'QA Methodologies',
    'Rust', 'Go', 'Microservices', 'GraphQL', 'WebSockets', 'Serverless'
]

tracks = {
    'devops': [
        ('Containerization with Docker', 'Learn how to package, distribute, and run applications in isolated environments using Docker.', 'beginner', 12, ['Docker'], []),
        ('Kubernetes Orchestration', 'Master container orchestration, scaling, pods, deployments, and services with K8s.', 'advanced', 24, ['Kubernetes'], ['Docker']),
        ('Infrastructure as Code', 'Use Terraform to provision cloud infrastructure automatically and manage state.', 'intermediate', 16, ['Terraform'], ['AWS']),
        ('Continuous Integration/Deployment', 'Build robust CI/CD pipelines using GitHub Actions, GitLab CI, and Jenkins.', 'intermediate', 14, ['CI/CD'], ['Docker', 'Git'])
    ],
    'game_dev': [
        ('Introduction to Game Dev with Unity', 'Build your first 2D and 3D games using Unity and C#.', 'beginner', 20, ['Unity', 'C#'], []),
        ('Unreal Engine Fundamentals', 'Learn Blueprints, material editors, and C++ for high-fidelity game development.', 'intermediate', 25, ['Unreal Engine', 'C++'], []),
        ('Game Design Principles', 'Level design, player psychology, progression systems, and game loops.', 'beginner', 10, ['Game Design'], [])
    ],
    'mobile_dev': [
        ('iOS App Development with Swift', 'Build native iOS applications using Swift and SwiftUI.', 'intermediate', 22, ['Swift', 'iOS Development'], []),
        ('Android App Development with Kotlin', 'Build native Android apps using Kotlin and Jetpack Compose.', 'intermediate', 22, ['Kotlin', 'Android Development'], []),
        ('Cross-Platform with React Native', 'Write once, run on iOS and Android using React and JavaScript.', 'intermediate', 18, ['React Native'], []),
        ('Flutter and Dart Mastery', 'Build beautiful, natively compiled applications for mobile from a single codebase.', 'intermediate', 20, ['Flutter'], [])
    ],
    'blockchain': [
        ('Blockchain Fundamentals', 'Understand distributed ledgers, consensus algorithms, and the architecture of Bitcoin and Ethereum.', 'beginner', 12, ['Blockchain', 'Cryptography'], []),
        ('Smart Contract Development', 'Write, test, and deploy smart contracts on Ethereum using Solidity and Hardhat.', 'intermediate', 18, ['Solidity', 'Smart Contracts'], ['Blockchain']),
        ('Web3 DApp Development', 'Build decentralized applications connecting React frontends to blockchain backends.', 'advanced', 20, ['Web3'], ['Solidity'])
    ],
    'ux_ui': [
        ('UI Design with Figma', 'Master Figma for interface design, components, auto-layout, and design systems.', 'beginner', 14, ['Figma'], []),
        ('UX Research and Psychology', 'Conduct user interviews, usability testing, and apply cognitive psychology to design.', 'beginner', 16, ['User Research'], []),
        ('Advanced Prototyping', 'Create high-fidelity, interactive prototypes with micro-interactions.', 'intermediate', 12, ['Prototyping'], ['Figma'])
    ],
    'qa_testing': [
        ('Software Testing Foundations', 'Learn test plans, test cases, bug reporting, and agile testing methodologies.', 'beginner', 10, ['QA Methodologies'], []),
        ('End-to-End Testing with Cypress', 'Write reliable automated UI tests for modern web applications.', 'intermediate', 14, ['Cypress', 'Automated Testing'], []),
        ('Test Automation Frameworks', 'Build scalable testing frameworks using Selenium and Python/Java.', 'advanced', 18, ['Selenium', 'Automated Testing'], ['Python'])
    ],
    'backend_advanced': [
        ('High-Performance Systems in Rust', 'Memory safety, concurrency without data races, and building fast backends in Rust.', 'advanced', 25, ['Rust'], []),
        ('Concurrent Programming in Go', 'Goroutines, channels, and building scalable microservices in Go.', 'intermediate', 18, ['Go', 'Microservices'], []),
        ('GraphQL API Development', 'Design and implement efficient GraphQL APIs to replace legacy REST endpoints.', 'intermediate', 14, ['GraphQL'], []),
        ('Serverless Architecture', 'Build event-driven apps using AWS Lambda, DynamoDB, and API Gateway.', 'intermediate', 16, ['Serverless', 'AWS'], [])
    ]
}

with open('s:/HCL/hcl/database/seed_v3.sql', 'w') as f:
    f.write("-- ============================================================\n")
    f.write("-- Massive Expansion of Skills and Courses\n")
    f.write("-- ============================================================\n\n")
    
    f.write("insert into skills (name) values\n")
    f.write(",\n".join([f"  ('{s}')" for s in skills]))
    f.write("\non conflict (name) do nothing;\n\n")
    
    f.write("insert into courses (title, description, difficulty, duration_hours, track) values\n")
    course_values = []
    for track, course_list in tracks.items():
        for course in course_list:
            title, desc, diff, dur, _, _ = course
            # escape single quotes in description
            desc = desc.replace("'", "''")
            course_values.append(f"('{title}', '{desc}', '{diff}', {dur}, '{track}')")
    
    f.write(",\n".join(course_values))
    f.write(";\n\n")
    
    for track, course_list in tracks.items():
        for course in course_list:
            title, _, _, _, teaches, prereqs = course
            
            f.write(f"-- === {title} ===\n")
            f.write("insert into course_skills (course_id, skill_id, is_prerequisite) values\n")
            
            values = []
            for prereq in prereqs:
                values.append(f"  ((select id from courses where title='{title}'), (select id from skills where name='{prereq}'), true)")
            for teach in teaches:
                values.append(f"  ((select id from courses where title='{title}'), (select id from skills where name='{teach}'), false)")
                
            f.write(",\n".join(values))
            f.write("\non conflict do nothing;\n\n")
