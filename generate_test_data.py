import pandas as pd
import random

data = []
for i in range(1, 101):
    data.append({
        'Hall Ticket No': f'HT{str(i).zfill(4)}',
        'Roll No': i,
        'Name': f'Student {i}',
        'Class': random.choice([9, 10]),
        'Section': random.choice(['A', 'B', 'C']),
        'Telugu': random.randint(30, 100),
        'Hindi': random.randint(30, 100),
        'English': random.randint(30, 100),
        'Maths': random.randint(20, 100),
        'Science': random.randint(25, 100),
        'Social': random.randint(30, 100),
    })

df = pd.DataFrame(data)
df.to_excel('test_results.xlsx', index=False)
print("Generated test_results.xlsx")
