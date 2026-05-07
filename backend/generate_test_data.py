import pandas as pd
import numpy as np
import os

def create_sample_data():
    """Generate test data matching the real SSC results Excel format:
    admno, ayear, Sname, Class, sec, rno, Hall Ticket No,
    I LANG, ENGLISH, MATHS, SCIENCE, SOCIAL, II LANG, TOTAL, Percentage, RESULT
    """
    np.random.seed(42)
    num_students = 80
    sections = ['A', 'B', 'C', 'D']
    names = [
        'Aarav Sharma', 'Priya Reddy', 'Mohammed Ali', 'Sneha Patel', 'Ravi Kumar',
        'Ananya Singh', 'Vikram Naidu', 'Divya Rao', 'Kiran Babu', 'Lakshmi Devi',
        'Arun Verma', 'Pooja Nair', 'Suresh Goud', 'Kavitha Pillai', 'Rahul Gupta',
        'Meena Srinivas', 'Arjun Teja', 'Swathi Menon', 'Rohit Joshi', 'Geeta Iyer',
    ]

    rows = []
    for i in range(num_students):
        # Random subject marks (realistic: mostly 60-100, some lower)
        lang1  = int(np.random.choice([np.random.randint(40, 100), np.random.randint(20, 60)], p=[0.85, 0.15]))
        english = int(np.random.choice([np.random.randint(45, 100), np.random.randint(20, 60)], p=[0.85, 0.15]))
        maths  = int(np.random.choice([np.random.randint(40, 100), np.random.randint(20, 60)], p=[0.80, 0.20]))
        science = int(np.random.choice([np.random.randint(50, 100), np.random.randint(20, 60)], p=[0.90, 0.10]))
        social  = int(np.random.choice([np.random.randint(55, 100), np.random.randint(20, 60)], p=[0.90, 0.10]))
        lang2  = int(np.random.choice([np.random.randint(40, 100), np.random.randint(20, 60)], p=[0.85, 0.15]))

        total = lang1 + english + maths + science + social + lang2
        percentage = round(total / 600 * 100, 2)
        result = 'PASS' if all(m >= 35 for m in [lang1, english, maths, science, social, lang2]) else 'FAIL'

        rows.append({
            'admno': 2500 + i,
            'ayear': '2025-2026',
            'Sname': names[i % len(names)] + f' {i+1}',
            'Class': 10,
            'sec': sections[i % len(sections)],
            'rno': i + 1,
            'Hall Ticket No': f'2622{100000 + i}',
            'I LANG': lang1,
            'ENGLISH': english,
            'MATHS': maths,
            'SCIENCE': science,
            'SOCIAL': social,
            'II LANG': lang2,
            'TOTAL': total,
            'Percentage': percentage,
            'RESULT': result,
        })

    df = pd.DataFrame(rows)

    target_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'test_results.xlsx')
    try:
        df.to_excel(target_path, index=False)
        print(f"Successfully created test file at {os.path.abspath(target_path)}")
        print(f"  Columns: {list(df.columns)}")
        print(f"  Rows: {len(df)}")
    except Exception as e:
        print(f"Error creating file: {e}")

if __name__ == '__main__':
    create_sample_data()
