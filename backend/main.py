from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from utils.analysis import process_student_data, generate_analytics
from utils.excel import generate_excel_report, generate_student_report_card, generate_batch_reports
import io

app = FastAPI(title="SSC Results Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for the latest uploaded data
global_data = {
    "df": None,
    "analytics": None
}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported")
        
    try:
        contents = await file.read()
        
        # Read ALL sheets from the Excel file
        all_sheets = pd.read_excel(io.BytesIO(contents), sheet_name=None)
        
        dfs = []
        for sheet_name, sheet_df in all_sheets.items():
            # Basic validation to skip empty sheets or sheets that don't look like student data
            if sheet_df.empty:
                continue
            # Trim column names for checks
            sheet_df.columns = sheet_df.columns.str.strip()
            cols_upper = [c.upper() for c in sheet_df.columns]
            
            # Look for any typical student data headers
            student_indicators = ['HALL TICKET NO', 'HTNO', 'HT NO', 'SNAME', 'STUDENT NAME', 'NAME', 'ADMNO', 'ADMISSION NO']
            if any(indicator in cols_upper for indicator in student_indicators):
                dfs.append(sheet_df)
        
        if not dfs:
            raise HTTPException(status_code=400, detail="No valid data found in any sheet of the Excel file.")
            
        df = pd.concat(dfs, ignore_index=True)
        
        # Clean column names to prevent 400 Missing Column errors
        df.columns = df.columns.str.strip()
        
        # Process data
        processed_df = process_student_data(df)
        analytics = generate_analytics(processed_df)
        
        # Save to global state
        global_data["df"] = processed_df
        global_data["analytics"] = analytics
        
        # Generate Excel report
        excel_bytes = generate_excel_report(processed_df, analytics)
        
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=SSC_Report.xlsx"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/analyze")
async def get_analytics():
    if global_data["analytics"] is None:
        raise HTTPException(status_code=404, detail="No data uploaded yet")
    return JSONResponse(content=global_data["analytics"])

@app.post("/reset")
async def reset_data():
    global_data["df"] = None
    global_data["analytics"] = None
    return {"message": "Data cleared successfully"}

@app.get("/student/{hall_ticket}")
async def get_student(hall_ticket: str):
    df = global_data["df"]
    if df is None:
        raise HTTPException(status_code=404, detail="No data uploaded yet")
        
    student = df[df['Hall Ticket No'].astype(str) == str(hall_ticket)]
    if student.empty:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Replace NaN with None for JSON serialization
    student = student.where(pd.notna(student), None)
    return JSONResponse(content=student.iloc[0].to_dict())

@app.get("/students")
async def get_all_students():
    df = global_data["df"]
    if df is None:
        raise HTTPException(status_code=404, detail="No data uploaded yet")
    
    # Replace NaN with None
    records = df.where(pd.notna(df), None).to_dict(orient="records")
    return JSONResponse(content=records)

@app.get("/student/{hall_ticket}/report")
async def get_student_report(hall_ticket: str):
    df = global_data["df"]
    if df is None:
        raise HTTPException(status_code=404, detail="No data uploaded yet")
        
    student = df[df['Hall Ticket No'].astype(str) == str(hall_ticket)]
    if student.empty:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Generate single student report card
    excel_bytes = generate_student_report_card(student.iloc[0])
    
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=Report_Card_{hall_ticket}.xlsx"
        }
    )

@app.get("/batch-reports/{class_name}/{section}")
async def get_batch_reports(class_name: str, section: str):
    df = global_data["df"]
    if df is None:
        raise HTTPException(status_code=404, detail="No data uploaded yet")
        
    # Generate batch reports
    excel_bytes = generate_batch_reports(df, class_name, section)
    
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=Batch_Reports_{class_name}_{section}.xlsx"
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
