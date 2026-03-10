function DepartmentList({ departments, onSelectDepartment, loading }) {
  if (loading) {
    return <div className="loading">Loading departments...</div>;
  }

  if (!departments || departments.length === 0) {
    return <div className="no-data">No departments available</div>;
  }

  return (
    <div className="department-list">
      <h2>Select a Department</h2>
      <div className="department-grid">
        {departments.map((dept) => (
          <button
            key={dept.code || dept.department_code}
            className="department-card"
            onClick={() => onSelectDepartment(dept)}
          >
            <h3>{dept.name || dept.department_name}</h3>
            <p>{dept.code || dept.department_code}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default DepartmentList;
