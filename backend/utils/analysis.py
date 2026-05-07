import pandas as pd
import numpy as np

# Real column names from the uploaded Excel file
# admno, ayear, Sname, Class, sec, rno, Hall Ticket No,
# I LANG, ENGLISH, MATHS, SCIENCE, SOCIAL, II LANG,
# TOTAL, Percentage, RESULT

SUBJECTS = ['I LANG', 'ENGLISH', 'MATHS', 'SCIENCE', 'SOCIAL', 'II LANG']

def process_student_data(df: pd.DataFrame) -> pd.DataFrame:
    # Strip all column names
    df = df.copy()
    df.columns = df.columns.str.strip()

    # Drop unnamed junk columns
    df = df.loc[:, ~df.columns.str.startswith('Unnamed')]

    # Case-insensitive mapping for flexible headers
    flexible_map = {
        'SNAME': 'Name',
        'STUDENT NAME': 'Name',
        'STUDENTNAME': 'Name',
        'FULL NAME': 'Name',
        'SEC': 'Section',
        'SECTION': 'Section',
        'GROUP': 'Section',
        'DIV': 'Section',
        'DIVISION': 'Section',
        'RNO': 'Roll No',
        'ROLL NO': 'Roll No',
        'ROLLNO': 'Roll No',
        'ADMNO': 'Adm No',
        'ADMISSION NO': 'Adm No',
        'ADMISSIONNO': 'Adm No',
        'AYEAR': 'Academic Year',
        'ACADEMIC YEAR': 'Academic Year',
        'RESULT': 'Result',
        'STATUS': 'Result',
        'HTNO': 'Hall Ticket No',
        'HALL TICKET NO': 'Hall Ticket No',
        'HT NO': 'Hall Ticket No',
        'HALLTICKET': 'Hall Ticket No',
        'CLASS': 'Class',
        'STANDARD': 'Class',
        'GRADE': 'Grade',
    }
    
    # Apply renaming while avoiding duplicates
    new_columns = list(df.columns)
    mapped_targets = {} # target: original_index
    
    for i, col in enumerate(new_columns):
        col_upper = col.upper().strip()
        if col_upper in flexible_map:
            target = flexible_map[col_upper]
            if target not in mapped_targets:
                new_columns[i] = target
                mapped_targets[target] = i
            else:
                # If target already exists, we keep this as original or give it a unique name
                # to prevent duplicate column names in the final DF
                pass 
    
    df.columns = new_columns

    # Handle Subjects flexibly
    subj_map = {
        'I LANG': ['I LANG', 'FIRST LANGUAGE', 'TELUGU', 'HINDI', '1ST LANG'],
        'ENGLISH': ['ENGLISH', 'ENG', '3RD LANG'],
        'MATHS': ['MATHS', 'MATHEMATICS', 'MATH'],
        'SCIENCE': ['SCIENCE', 'SCI', 'GEN SCIENCE', 'GENERAL SCIENCE'],
        'SOCIAL': ['SOCIAL', 'SOCIAL STUDIES', 'SOC', 'SOCIAL SCIENCE'],
        'II LANG': ['II LANG', 'SECOND LANGUAGE', 'HINDI II', 'TELUGU II', '2ND LANG']
    }
    
    new_columns = list(df.columns)
    for target_sub, synonyms in subj_map.items():
        if target_sub in new_columns:
            continue
        for syn in synonyms:
            found_col = None
            for col in df.columns:
                if col.upper().strip() == syn:
                    found_col = col
                    break
            
            if found_col:
                idx = new_columns.index(found_col)
                if target_sub not in new_columns:
                    new_columns[idx] = target_sub
                break
    
    df.columns = new_columns
    
    # Identify actual subjects present
    actual_subs = [s for s in SUBJECTS if s in df.columns]

    # Fill defaults for Class/Section if missing
    if 'Class' not in df.columns:
        df['Class'] = '10'
    if 'Section' not in df.columns:
        df['Section'] = 'A'
        
    required_cols = ['Hall Ticket No', 'Name'] + actual_subs
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column: '{col}'. Found columns: {list(df.columns)}")

    # Clean Class and Section
    df['Class'] = df['Class'].fillna('10').astype(str).str.strip()
    df['Section'] = df['Section'].fillna('A').astype(str).str.strip()
    
    # Ensure subjects are numeric
    for sub in actual_subs:
        df[sub] = pd.to_numeric(df[sub], errors='coerce').fillna(0)
        
    # Recalculate Total & Percentage
    df['Total'] = df[actual_subs].sum(axis=1)
    df['Percentage'] = (df['Total'] / (max(len(actual_subs), 1) * 100) * 100).round(2)

    # Normalise result
    if 'Result' not in df.columns:
        df['Result'] = df[actual_subs].apply(
            lambda row: 'Pass' if all(v >= 35 for v in row) else 'Fail',
            axis=1
        )
    else:
        df['Result'] = df['Result'].astype(str).str.strip().str.upper()
        df['Result'] = df['Result'].map(lambda v: 'Pass' if v in ('PASS', 'P', 'PASSED') else 'Fail')

    # Grade
    def get_grade(row):
        if row['Result'] == 'Fail':
            return 'Fail'
        pct = row['Percentage']
        if pct >= 90: return 'A+'
        elif pct >= 80: return 'A'
        elif pct >= 70: return 'B'
        elif pct >= 60: return 'C'
        else: return 'D'

    df['Grade'] = df.apply(get_grade, axis=1)

    return df


def _student_dict(row: pd.Series) -> dict:
    """Convert a student Series to a JSON-safe dict."""
    d = {}
    for k, v in row.items():
        if pd.isna(v):
            d[k] = None
        elif isinstance(v, (np.integer,)):
            d[k] = int(v)
        elif isinstance(v, (np.floating,)):
            d[k] = float(v)
        else:
            d[k] = v
    return d


def generate_analytics(df: pd.DataFrame) -> dict:
    total_students = len(df)
    if total_students == 0:
        return {}

    pass_count = len(df[df['Result'] == 'Pass'])
    pass_percentage = round(pass_count / total_students * 100, 2)
    average_percentage = round(df['Percentage'].mean(), 2)

    topper = _student_dict(df.loc[df['Percentage'].idxmax()])
    lowest = _student_dict(df.loc[df['Percentage'].idxmin()])

    # Class-wise
    class_analysis = []
    for cls, group in df.groupby('Class'):
        c_total = len(group)
        c_pass = len(group[group['Result'] == 'Pass'])
        c_topper_idx = group['Percentage'].idxmax()
        c_lowest_idx = group['Percentage'].idxmin()
        c_topper = _student_dict(group.loc[c_topper_idx])
        c_lowest = _student_dict(group.loc[c_lowest_idx])
        class_analysis.append({
            'Class': str(cls),
            'Student Count': c_total,
            'Avg %': round(group['Percentage'].mean(), 2),
            'Pass %': round(c_pass / c_total * 100, 2),
            'Topper Name': c_topper.get('Name', 'Unknown'),
            'Topper HT': c_topper.get('Hall Ticket No', 'N/A'),
            'Topper %': c_topper.get('Percentage', 0),
            'Lowest Name': c_lowest.get('Name', 'Unknown'),
            'Lowest HT': c_lowest.get('Hall Ticket No', 'N/A'),
            'Lowest %': c_lowest.get('Percentage', 0),
            'topper': c_topper,
            'lowest': c_lowest,
        })

    # Section-wise
    section_analysis = []
    for (cls, sec), group in df.groupby(['Class', 'Section']):
        s_total = len(group)
        s_pass = len(group[group['Result'] == 'Pass'])
        s_topper_idx = group['Percentage'].idxmax()
        s_lowest_idx = group['Percentage'].idxmin()
        s_topper = _student_dict(group.loc[s_topper_idx])
        s_lowest = _student_dict(group.loc[s_lowest_idx])
        section_analysis.append({
            'Class': str(cls),
            'Section': str(sec),
            'Student Count': s_total,
            'Avg %': round(group['Percentage'].mean(), 2),
            'Pass %': round(s_pass / s_total * 100, 2),
            'Topper Name': s_topper.get('Name', 'Unknown'),
            'Topper HT': s_topper.get('Hall Ticket No', 'N/A'),
            'Topper %': s_topper.get('Percentage', 0),
            'Lowest Name': s_lowest.get('Name', 'Unknown'),
            'Lowest HT': s_lowest.get('Hall Ticket No', 'N/A'),
            'Lowest %': s_lowest.get('Percentage', 0),
            'topper': s_topper,
            'lowest': s_lowest,
        })

    # Subject-wise
    subject_analysis = []
    actual_subs = [s for s in SUBJECTS if s in df.columns]
    
    for sub in actual_subs:
        sub_series = df[sub]
        sub_pass_count = len(df[sub_series >= 35])
        sub_avg = round(sub_series.mean(), 2)
        sub_topper_idx = sub_series.idxmax()
        sub_topper = _student_dict(df.loc[sub_topper_idx])
        
        # Grade Distribution for this subject
        grades = []
        for marks in sub_series:
            if pd.isna(marks) or marks < 35: grades.append('Fail')
            elif marks >= 90: grades.append('A+')
            elif marks >= 80: grades.append('A')
            elif marks >= 70: grades.append('B')
            elif marks >= 60: grades.append('C')
            else: grades.append('D')
        
        g_counts = pd.Series(grades).value_counts().to_dict()
        g_dist = [{'Grade': k, 'Count': int(v)} for k, v in g_counts.items()]

        # Section-wise toppers for this subject
        sec_toppers = []
        invalid_vals = ['nan', '', 'None', 'nan', 'NAN', 'Unknown']
        valid_sections_df = df[~df['Section'].astype(str).str.lower().isin(invalid_vals)]
        
        for (cls, sec), sec_group in valid_sections_df.groupby(['Class', 'Section']):
            sec_sub_series = sec_group[sub]
            if not sec_sub_series.empty:
                s_top_idx = sec_sub_series.idxmax()
                s_top_row = sec_group.loc[s_top_idx]
                sec_toppers.append({
                    'Section': f"{cls}-{sec}" if len(df['Class'].unique()) > 1 else str(sec),
                    'Name': s_top_row.get('Name', 'Unknown'),
                    'Marks': float(s_top_row[sub])
                })

        subject_analysis.append({
            'Subject': sub,
            'Average': sub_avg,
            'Pass %': round(sub_pass_count / total_students * 100, 2),
            'Topper Name': sub_topper.get('Name', 'Unknown'),
            'Topper HT': sub_topper.get('Hall Ticket No', 'N/A'),
            'Topper Marks': float(sub_topper.get(sub, 0)),
            'Grade Distribution': g_dist,
            'Section Toppers': sec_toppers
        })

    # Grade distribution
    grade_counts = df['Grade'].value_counts().to_dict()
    grade_distribution = [{'Grade': k, 'Count': int(v)} for k, v in grade_counts.items()]

    return {
        'overall': {
            'total_students': total_students,
            'pass_percentage': pass_percentage,
            'average_percentage': average_percentage,
            'topper': topper,
            'lowest_performer': lowest,
        },
        'class_wise': class_analysis,
        'section_wise': section_analysis,
        'subject_wise': subject_analysis,
        'grade_distribution': grade_distribution,
    }

