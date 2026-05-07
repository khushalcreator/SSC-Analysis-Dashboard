import pandas as pd
import io
from utils.analysis import SUBJECTS

# ── Subject display names ──────────────────────────────────────────────────────
SUBJ_DISPLAY = {
    'I LANG':   'I Language',
    'ENGLISH':  'English',
    'MATHS':    'Maths',
    'SCIENCE':  'Science',
    'SOCIAL':   'Social',
    'II LANG':  'II Language',
}

# Marks string: "I Lang: 90 | English: 88 | ..."
def _marks_str(student: dict) -> str:
    parts = []
    for col, label in SUBJ_DISPLAY.items():
        v = student.get(col)
        if v is not None:
            parts.append(f"{label}: {v}")
    total = student.get('Total')
    pct   = student.get('Percentage')
    if total is not None:
        parts.append(f"Total: {total}")
    if pct is not None:
        parts.append(f"({pct}%)")
    return ' | '.join(parts)


def _safe(v):
    """Return None for NaN/NaT, else the value."""
    if v is None:
        return None
    try:
        if pd.isna(v):
            return None
    except Exception:
        pass
    return v


# ── Format factory ─────────────────────────────────────────────────────────────
class Formats:
    def __init__(self, wb):
        common = dict(font_name='Calibri', font_size=10,
                      align='center', valign='vcenter', border=1, text_wrap=True)

        def f(**kw): return wb.add_format({**common, **kw})

        self.header   = f(bold=True, bg_color='#2563EB', font_color='#FFFFFF',
                          font_size=11, border=2)
        self.title    = wb.add_format(dict(bold=True, font_size=13,
                                           font_name='Calibri',
                                           bg_color='#1D4ED8', font_color='#FFFFFF',
                                           align='center', valign='vcenter', border=0))
        self.cell     = f(bg_color='#FFFFFF')
        self.alt      = f(bg_color='#EFF6FF')          # light blue stripe
        self.topper   = f(bold=True, bg_color='#DCFCE7', font_color='#14532D')  # green
        self.lowest   = f(bold=True, bg_color='#FEE2E2', font_color='#7F1D1D')  # red
        self.fail_row = f(bg_color='#FEF9C3', font_color='#713F12')             # yellow
        self.pass_tag = f(bold=True, bg_color='#BBF7D0', font_color='#14532D')
        self.fail_tag = f(bold=True, bg_color='#FECACA', font_color='#7F1D1D')
        self.grade_ap = f(bold=True, bg_color='#86EFAC', font_color='#14532D')
        self.grade_a  = f(bold=True, bg_color='#BEF264', font_color='#365314')
        self.grade_b  = f(bold=True, bg_color='#FDE68A', font_color='#78350F')
        self.grade_c  = f(bold=True, bg_color='#FED7AA', font_color='#7C2D12')
        self.grade_d  = f(bold=True, bg_color='#FECACA', font_color='#7F1D1D')
        self.grade_fail = f(bold=True, bg_color='#F87171', font_color='#FFFFFF')

        self._grade_map = {
            'A+': self.grade_ap, 'A': self.grade_a, 'B': self.grade_b,
            'C': self.grade_c,  'D': self.grade_d, 'Fail': self.grade_fail,
        }

    def grade(self, g): return self._grade_map.get(str(g), self.cell)


def _write_title(ws, fmt, title, ncols, row=0, height=28):
    ws.set_row(row, height)
    ws.merge_range(row, 0, row, ncols - 1, title, fmt.title)


def _write_headers(ws, fmt, cols, row=1, height=22):
    ws.set_row(row, height)
    for c, col in enumerate(cols):
        ws.write(row, c, col, fmt.header)


def _auto_width(ws, df, col_idx, col_name, extra=4, max_w=50):
    try:
        w = max(
            df[col_name].apply(lambda x: len(str(x)) if x is not None else 0).max(),
            len(str(col_name))
        ) + extra
    except Exception:
        w = len(str(col_name)) + extra
    ws.set_column(col_idx, col_idx, min(w, max_w))


# ══════════════════════════════════════════════════════════════════════════════
# MAIN ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════
def generate_excel_report(df: pd.DataFrame, analytics: dict) -> bytes:
    output = io.BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')
    wb     = writer.book
    fmt    = Formats(wb)

    overall    = analytics['overall']
    topper_d   = overall['topper'] or {}
    lowest_d   = overall['lowest_performer'] or {}
    topper_ht  = str(topper_d.get('Hall Ticket No', ''))
    lowest_ht  = str(lowest_d.get('Hall Ticket No', ''))

    # ── Sheet 1: Student Data ──────────────────────────────────────────────────
    display_cols = [
        'Hall Ticket No', 'Name', 'Class', 'Section',
    ] + [SUBJ_DISPLAY.get(s, s) for s in SUBJECTS] + ['Total', 'Percentage', 'Grade', 'Result']

    df_disp = df.copy()
    df_disp = df_disp.rename(columns={s: SUBJ_DISPLAY[s] for s in SUBJECTS if s in df_disp.columns})
    avail_cols = [c for c in display_cols if c in df_disp.columns]
    df_disp = df_disp[avail_cols]

    ws1 = wb.add_worksheet('Student Data')
    writer.sheets['Student Data'] = ws1

    ncols = len(avail_cols)
    _write_title(ws1, fmt, 'SSC 2025-2026 — Student Results', ncols)
    _write_headers(ws1, fmt, avail_cols)

    for r, (_, row) in enumerate(df_disp.iterrows()):
        row_idx   = r + 2
        ht_val    = str(_safe(row.get('Hall Ticket No')) or '')
        result    = str(_safe(row.get('Result')) or '')
        grade_val = str(_safe(row.get('Grade')) or '')

        if ht_val == topper_ht:
            base = fmt.topper
        elif ht_val == lowest_ht:
            base = fmt.lowest
        elif result == 'Fail':
            base = fmt.fail_row
        else:
            base = fmt.alt if r % 2 else fmt.cell

        ws1.set_row(row_idx, 18)
        for c, col in enumerate(avail_cols):
            val = _safe(row.get(col))
            cell_fmt = base
            if col == 'Result':
                cell_fmt = fmt.pass_tag if val == 'Pass' else fmt.fail_tag
            elif col == 'Grade':
                cell_fmt = fmt.grade(val)
            ws1.write(row_idx, c, val, cell_fmt)

    for ci, col in enumerate(avail_cols):
        _auto_width(ws1, df_disp, ci, col)

    # ── Sheet 2: Overall Summary ───────────────────────────────────────────────
    pass_count = int(round(overall['total_students'] * overall['pass_percentage'] / 100))
    fail_count = overall['total_students'] - pass_count

    cols_ov = [
        'Total Students', 'Pass %', 'Fail %', 'Average %',
        'Topper Name', 'Topper Hall Ticket No', 'Topper Marks',
        'Lowest Name', 'Lowest Hall Ticket No', 'Lowest Marks',
    ]
    rows_ov = [{
        'Total Students':       overall['total_students'],
        'Pass %':               f"{overall['pass_percentage']}%",
        'Fail %':               f"{round(100 - overall['pass_percentage'], 2)}%",
        'Average %':            f"{overall['average_percentage']}%",
        'Topper Name':          _safe(topper_d.get('Name')),
        'Topper Hall Ticket No': _safe(topper_d.get('Hall Ticket No')),
        'Topper Marks':         _marks_str(topper_d),
        'Lowest Name':          _safe(lowest_d.get('Name')),
        'Lowest Hall Ticket No': _safe(lowest_d.get('Hall Ticket No')),
        'Lowest Marks':         _marks_str(lowest_d),
    }]
    df_ov = pd.DataFrame(rows_ov, columns=cols_ov)

    ws2 = wb.add_worksheet('Overall Summary')
    writer.sheets['Overall Summary'] = ws2
    _write_title(ws2, fmt, 'SSC 2025-2026 — Overall School Performance Summary', len(cols_ov))
    _write_headers(ws2, fmt, cols_ov)
    ws2.set_row(2, 40)
    for c, col in enumerate(cols_ov):
        ws2.write(2, c, df_ov.iloc[0][col], fmt.cell)
        _auto_width(ws2, df_ov, c, col, extra=4, max_w=60)

    # ── Sheet 3: Class Analysis ────────────────────────────────────────────────
    cols_cl = [
        'Class', 'Students', 'Avg %', 'Pass %', 'Fail %',
        'Topper Name', 'Topper Hall Ticket No', 'Topper Marks',
        'Lowest Name',  'Lowest Hall Ticket No', 'Lowest Marks',
    ]
    rows_cl = []
    for row in analytics['class_wise']:
        tp = row.get('topper') or {}
        lw = row.get('lowest') or {}
        pass_p = row['Pass %']
        rows_cl.append({
            'Class':               row['Class'],
            'Students':            row['Student Count'],
            'Avg %':               f"{row['Avg %']}%",
            'Pass %':              f"{pass_p}%",
            'Fail %':              f"{round(100 - pass_p, 2)}%",
            'Topper Name':         _safe(tp.get('Name')),
            'Topper Hall Ticket No': _safe(tp.get('Hall Ticket No')),
            'Topper Marks':        _marks_str(tp),
            'Lowest Name':         _safe(lw.get('Name')),
            'Lowest Hall Ticket No': _safe(lw.get('Hall Ticket No')),
            'Lowest Marks':        _marks_str(lw),
        })
    df_cl = pd.DataFrame(rows_cl, columns=cols_cl)

    ws3 = wb.add_worksheet('Class Analysis')
    writer.sheets['Class Analysis'] = ws3
    _write_title(ws3, fmt, 'SSC 2025-2026 — Class-Wise Performance Analysis', len(cols_cl))
    _write_headers(ws3, fmt, cols_cl)
    for r, row in df_cl.iterrows():
        row_idx = r + 2
        ws3.set_row(row_idx, 30)
        row_fmt = fmt.alt if r % 2 else fmt.cell
        for c, col in enumerate(cols_cl):
            ws3.write(row_idx, c, row[col], row_fmt)
    for ci, col in enumerate(cols_cl):
        _auto_width(ws3, df_cl, ci, col, max_w=60)

    # ── Sheet 4: Section Analysis ──────────────────────────────────────────────
    cols_sec = [
        'Class', 'Section', 'Students', 'Avg %', 'Pass %', 'Fail %', 'Avg Marks (Section)',
        'Topper Name', 'Topper Hall Ticket No', 'Topper Marks',
        'Lowest Name',  'Lowest Hall Ticket No', 'Lowest Marks',
    ]
    rows_sec = []
    # Build per-section avg marks from original df
    for row in analytics['section_wise']:
        tp = row.get('topper') or {}
        lw = row.get('lowest') or {}
        pass_p = row['Pass %']
        # avg marks = avg of Total column for that class+section
        mask = (df['Class'].astype(str) == str(row['Class'])) & (df['Section'].astype(str) == str(row['Section']))
        avg_marks = round(df.loc[mask, 'Total'].mean(), 1) if mask.any() else 'N/A'
        rows_sec.append({
            'Class':               row['Class'],
            'Section':             row['Section'],
            'Students':            row['Student Count'],
            'Avg %':               f"{row['Avg %']}%",
            'Pass %':              f"{pass_p}%",
            'Fail %':              f"{round(100 - pass_p, 2)}%",
            'Avg Marks (Section)': avg_marks,
            'Topper Name':         _safe(tp.get('Name')),
            'Topper Hall Ticket No': _safe(tp.get('Hall Ticket No')),
            'Topper Marks':        _marks_str(tp),
            'Lowest Name':         _safe(lw.get('Name')),
            'Lowest Hall Ticket No': _safe(lw.get('Hall Ticket No')),
            'Lowest Marks':        _marks_str(lw),
        })
    df_sec = pd.DataFrame(rows_sec, columns=cols_sec)

    ws4 = wb.add_worksheet('Section Analysis')
    writer.sheets['Section Analysis'] = ws4
    _write_title(ws4, fmt, 'SSC 2025-2026 — Section-Wise Performance Analysis', len(cols_sec))
    _write_headers(ws4, fmt, cols_sec)
    for r, row in df_sec.iterrows():
        row_idx = r + 2
        ws4.set_row(row_idx, 30)
        row_fmt = fmt.alt if r % 2 else fmt.cell
        for c, col in enumerate(cols_sec):
            ws4.write(row_idx, c, row[col], row_fmt)
    for ci, col in enumerate(cols_sec):
        _auto_width(ws4, df_sec, ci, col, max_w=60)

    # ── Sheet 5: Subject Analysis ──────────────────────────────────────────────
    cols_subj = ['Subject', 'Average Marks', 'Highest Marks', 'Lowest Marks',
                 'Pass Count (≥35)', 'Fail Count (<35)']
    rows_subj = []
    for sub in SUBJECTS:
        scores = pd.to_numeric(df[sub], errors='coerce')
        rows_subj.append({
            'Subject':          SUBJ_DISPLAY.get(sub, sub),
            'Average Marks':    round(scores.mean(), 2),
            'Highest Marks':    int(scores.max()),
            'Lowest Marks':     int(scores.min()),
            'Pass Count (≥35)': int((scores >= 35).sum()),
            'Fail Count (<35)': int((scores < 35).sum()),
        })
    df_subj = pd.DataFrame(rows_subj, columns=cols_subj)

    ws5 = wb.add_worksheet('Subject Analysis')
    writer.sheets['Subject Analysis'] = ws5
    _write_title(ws5, fmt, 'SSC 2025-2026 — Subject-Wise Performance Analysis', len(cols_subj))
    _write_headers(ws5, fmt, cols_subj)
    for r, row in df_subj.iterrows():
        row_idx = r + 2
        ws5.set_row(row_idx, 20)
        row_fmt = fmt.alt if r % 2 else fmt.cell
        for c, col in enumerate(cols_subj):
            ws5.write(row_idx, c, row[col], row_fmt)
    ws5.set_column(0, 0, 18)
    for ci in range(1, len(cols_subj)):
        ws5.set_column(ci, ci, 20)

    # ── Sheet 6: Grade Distribution ────────────────────────────────────────────
    cols_grade = ['Grade', 'Student Count', 'Percentage of Total']
    total_s = overall['total_students']
    rows_grade = []
    grade_order = ['A+', 'A', 'B', 'C', 'D', 'Fail']
    grade_map = {g['Grade']: g['Count'] for g in analytics['grade_distribution']}
    for g in grade_order:
        cnt = grade_map.get(g, 0)
        rows_grade.append({
            'Grade':                g,
            'Student Count':        cnt,
            'Percentage of Total':  f"{round(cnt/total_s*100, 1)}%" if total_s > 0 else '0%',
        })
    df_grade = pd.DataFrame(rows_grade, columns=cols_grade)

    ws_g = wb.add_worksheet('Grade Distribution')
    writer.sheets['Grade Distribution'] = ws_g
    _write_title(ws_g, fmt, 'SSC 2025-2026 — Grade Distribution', len(cols_grade))
    _write_headers(ws_g, fmt, cols_grade)
    for r, row in df_grade.iterrows():
        row_idx = r + 2
        ws_g.set_row(row_idx, 20)
        gfmt = fmt.grade(row['Grade'])
        for c, col in enumerate(cols_grade):
            ws_g.write(row_idx, c, row[col], gfmt)
    ws_g.set_column(0, 0, 14)
    ws_g.set_column(1, 1, 18)
    ws_g.set_column(2, 2, 22)

    # ── Sheet 7: Top & Lowest ──────────────────────────────────────────────────
    cols_top = ['Type', 'Name', 'Hall Ticket No', 'Class', 'Section',
                'I Language', 'English', 'Maths', 'Science', 'Social', 'II Language',
                'Total', 'Percentage', 'Grade', 'Result']
    rows_top = []
    for label, student, row_fmt_key in [
        ('🏆 Topper',          topper_d, 'topper'),
        ('⚠ Lowest Performer', lowest_d, 'lowest'),
    ]:
        if student:
            rows_top.append({
                'Type':         label,
                'Name':         _safe(student.get('Name')),
                'Hall Ticket No': _safe(student.get('Hall Ticket No')),
                'Class':        _safe(student.get('Class')),
                'Section':      _safe(student.get('Section')),
                'I Language':   _safe(student.get('I LANG')),
                'English':      _safe(student.get('ENGLISH')),
                'Maths':        _safe(student.get('MATHS')),
                'Science':      _safe(student.get('SCIENCE')),
                'Social':       _safe(student.get('SOCIAL')),
                'II Language':  _safe(student.get('II LANG')),
                'Total':        _safe(student.get('Total')),
                'Percentage':   _safe(student.get('Percentage')),
                'Grade':        _safe(student.get('Grade')),
                'Result':       _safe(student.get('Result')),
                '_fmt':         row_fmt_key,
            })
    df_top = pd.DataFrame(rows_top)

    ws7 = wb.add_worksheet('Top & Lowest')
    writer.sheets['Top & Lowest'] = ws7
    _write_title(ws7, fmt, 'SSC 2025-2026 — School Topper vs Lowest Performer', len(cols_top))
    _write_headers(ws7, fmt, cols_top)
    for r, row in df_top.iterrows():
        row_idx  = r + 2
        ws7.set_row(row_idx, 22)
        base_fmt = fmt.topper if row.get('_fmt') == 'topper' else fmt.lowest
        for c, col in enumerate(cols_top):
            val = _safe(row.get(col))
            cell_fmt = base_fmt
            if col == 'Result':
                cell_fmt = fmt.pass_tag if val == 'Pass' else fmt.fail_tag
            elif col == 'Grade':
                cell_fmt = fmt.grade(val)
            ws7.write(row_idx, c, val, cell_fmt)
    ws7.set_column(0, 0, 22)   # Type
    ws7.set_column(1, 1, 25)   # Name
    ws7.set_column(2, 2, 18)   # HT No
    ws7.set_column(3, 4, 10)   # Class, Section
    for ci in range(5, len(cols_top)):
        ws7.set_column(ci, ci, 14)

    writer.close()
    return output.getvalue()


def generate_student_report_card(student_row: pd.Series) -> bytes:
    """Generate a formal report card for a single student."""
    output = io.BytesIO()
    wb = pd.ExcelWriter(output, engine='xlsxwriter').book
    fmt = Formats(wb)
    ws = wb.add_worksheet('Report Card')
    
    # Page Setup
    ws.set_margins(0.5, 0.5, 0.5, 0.5)
    ws.center_horizontally()
    
    # ── Report Card Layout ──────────────────────────────────────────────────
    # Column Widths
    ws.set_column(0, 0, 20)
    ws.set_column(1, 1, 30)
    
    # Title
    ws.merge_range('A1:B1', 'OFFICIAL SSC ACADEMIC REPORT CARD', fmt.title)
    ws.set_row(0, 35)
    
    # Student Basic Info
    info_rows = [
        ('Name', student_row['Name']),
        ('Hall Ticket No', student_row['Hall Ticket No']),
        ('Roll No', student_row['Roll No']),
        ('Class & Section', f"{student_row['Class']} - {student_row['Section']}"),
    ]
    
    curr_row = 2
    for label, val in info_rows:
        ws.write(curr_row, 0, label, fmt.header)
        ws.write(curr_row, 1, val, fmt.cell)
        ws.set_row(curr_row, 22)
        curr_row += 1
        
    curr_row += 1 # Spacer
    
    # Header for Marks
    ws.merge_range(f'A{curr_row+1}:B{curr_row+1}', 'SUBJECT PERFORMANCE', fmt.header)
    ws.set_row(curr_row, 25)
    curr_row += 1
    
    # Subject Marks
    subjects_to_show = [
        ('I Language (Telugu)', 'I LANG'),
        ('Hindi', 'II LANG'),
        ('English', 'ENGLISH'),
        ('Maths', 'MATHS'),
        ('Science', 'SCIENCE'),
        ('Social Studies', 'SOCIAL'),
    ]
    
    for label, col in subjects_to_show:
        marks = student_row.get(col, student_row.get(label.split(' (')[0].split(' ')[0].upper()))
        if marks is None: # fallback for generic names
            marks = student_row.get(label.split(' (')[0])
            
        ws.write(curr_row, 0, label, fmt.alt)
        ws.write(curr_row, 1, marks, fmt.cell)
        ws.set_row(curr_row, 20)
        curr_row += 1
        
    curr_row += 1 # Spacer
    
    # Final Result
    ws.write(curr_row, 0, 'TOTAL MARKS', fmt.header)
    ws.write(curr_row, 1, f"{student_row['Total']} / 600", fmt.header)
    ws.set_row(curr_row, 25)
    curr_row += 1
    
    ws.write(curr_row, 0, 'PERCENTAGE', fmt.alt)
    ws.write(curr_row, 1, f"{student_row['Percentage']}%", fmt.cell)
    ws.set_row(curr_row, 22)
    curr_row += 1
    
    ws.write(curr_row, 0, 'GRADE', fmt.alt)
    ws.write(curr_row, 1, student_row['Grade'], fmt.grade(student_row['Grade']))
    ws.set_row(curr_row, 22)
    curr_row += 1
    
    ws.write(curr_row, 0, 'FINAL RESULT', fmt.header)
    res_fmt = fmt.pass_tag if student_row['Result'] == 'Pass' else fmt.fail_tag
    ws.write(curr_row, 1, student_row['Result'], res_fmt)
    ws.set_row(curr_row, 28)
    
    # Disclaimer
    curr_row += 3
    ws.merge_range(f'A{curr_row+1}:B{curr_row+1}', 'This is a computer-generated report and does not require a physical signature.', fmt.cell)
    ws.set_row(curr_row, 15)
    
    wb.close()
    return output.getvalue()


def generate_batch_reports(df: pd.DataFrame, class_name: str, section: str) -> bytes:
    """Generate a single workbook containing report cards for all students in a section."""
    output = io.BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')
    wb = writer.book
    fmt = Formats(wb)
    
    # Filter for the section
    section_df = df[(df['Class'].astype(str) == str(class_name)) & (df['Section'].astype(str) == str(section))]
    
    for _, student_row in section_df.iterrows():
        # Sheet names have 31 char limit and must be unique
        sheet_name = f"{str(student_row['Hall Ticket No'])[-8:]}"
        ws = wb.add_worksheet(sheet_name)
        
        # Page Setup
        ws.set_margins(0.5, 0.5, 0.5, 0.5)
        ws.center_horizontally()
        
        # ── Report Card Layout (Same as single report card) ─────────────────
        ws.set_column(0, 0, 20)
        ws.set_column(1, 1, 30)
        
        ws.merge_range('A1:B1', 'OFFICIAL SSC ACADEMIC REPORT CARD', fmt.title)
        ws.set_row(0, 35)
        
        info_rows = [
            ('Name', student_row['Name']),
            ('Hall Ticket No', student_row['Hall Ticket No']),
            ('Roll No', student_row['Roll No']),
            ('Class & Section', f"{student_row['Class']} - {student_row['Section']}"),
        ]
        
        curr_row = 2
        for label, val in info_rows:
            ws.write(curr_row, 0, label, fmt.header)
            ws.write(curr_row, 1, val, fmt.cell)
            ws.set_row(curr_row, 22)
            curr_row += 1
            
        curr_row += 1
        ws.merge_range(f'A{curr_row+1}:B{curr_row+1}', 'SUBJECT PERFORMANCE', fmt.header)
        ws.set_row(curr_row, 25)
        curr_row += 1
        
        subjects_to_show = [
            ('I Language (Telugu)', 'I LANG'),
            ('Hindi', 'II LANG'),
            ('English', 'ENGLISH'),
            ('Maths', 'MATHS'),
            ('Science', 'SCIENCE'),
            ('Social Studies', 'SOCIAL'),
        ]
        
        for label, col in subjects_to_show:
            marks = student_row.get(col)
            ws.write(curr_row, 0, label, fmt.alt)
            ws.write(curr_row, 1, marks, fmt.cell)
            ws.set_row(curr_row, 20)
            curr_row += 1
            
        curr_row += 1
        ws.write(curr_row, 0, 'TOTAL MARKS', fmt.header)
        ws.write(curr_row, 1, f"{student_row['Total']} / 600", fmt.header)
        ws.set_row(curr_row, 25)
        curr_row += 1
        
        ws.write(curr_row, 0, 'PERCENTAGE', fmt.alt)
        ws.write(curr_row, 1, f"{student_row['Percentage']}%", fmt.cell)
        ws.set_row(curr_row, 22)
        curr_row += 1
        
        ws.write(curr_row, 0, 'GRADE', fmt.alt)
        ws.write(curr_row, 1, student_row['Grade'], fmt.grade(student_row['Grade']))
        ws.set_row(curr_row, 22)
        curr_row += 1
        
        ws.write(curr_row, 0, 'FINAL RESULT', fmt.header)
        res_fmt = fmt.pass_tag if student_row['Result'] == 'Pass' else fmt.fail_tag
        ws.write(curr_row, 1, student_row['Result'], res_fmt)
        ws.set_row(curr_row, 28)
        
        curr_row += 3
        ws.merge_range(f'A{curr_row+1}:B{curr_row+1}', 'This is a computer-generated report and does not require a physical signature.', fmt.cell)
        ws.set_row(curr_row, 15)

    writer.close()
    return output.getvalue()
