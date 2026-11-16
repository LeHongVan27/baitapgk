import {
    calculateStudentResult,
    calculateScholarships,
    formatCurrency
} from "./grade-calculator.js";

function formatScore(score) {
    return score.toFixed(2);
}

export function renderStudentList(displayedStudents, subjects, grades, allStudents = displayedStudents) {
    const tableHead = document.getElementById("tableHead");
    const tableBody = document.getElementById("studentTableBody");

    tableHead.innerHTML = `
    <tr>
        <th>Mã SV</th>
        <th>Họ và tên</th>
        ${subjects.map(subject => `<th>${subject.name}</th>`).join("")}
        <th>Điểm TB</th>
        <th>Xếp loại</th>
        <th>Thứ hạng</th>
        <th>Nhóm học bổng</th>
        <th>Học bổng</th>
        <th>Chi tiết</th>
    </tr>
    `;

    const gradeMap = new Map(grades.map(grade => [grade.student_id, grade]));
    const allStudentsWithResults = allStudents
        .map(student => {
            const grade = gradeMap.get(student.id);
            return grade ? { ...student, result: calculateStudentResult(grade, subjects) } : null;
        })
        .filter(Boolean);

    const scholarshipMap = calculateScholarships(allStudentsWithResults);

    tableBody.innerHTML = displayedStudents.map(student => {
        const info = scholarshipMap.get(student.id);

        if (!info) {
            return `
                <tr>
                    <td>${student.id}</td>
                    <td>${student.name}</td>
                    <td colspan="${subjects.length + 6}">Chưa có dữ liệu điểm</td>
                </tr>
            `;
        }

        const { result, rank, scholarshipGroup, scholarshipAmount } = info;

        return `
            <tr>
                <td>${student.id}</td>
                <td class="student-name">${student.name}</td>
                ${result.subjectResults.map(item => `
                    <td>${formatScore(item.average)}</td>
                `).join("")}
                <td class="average-score">${formatScore(result.average)}</td>
                <td><span class="classification">${result.classification}</span></td>
                <td><strong>#${rank}</strong></td>
                <td>${scholarshipGroup}</td>
                <td>${formatCurrency(scholarshipAmount)}</td>
                <td>
                    <button class="detail-button" data-student-id="${student.id}">
                        Xem / Sửa
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    document.getElementById("totalStudents").textContent = allStudents.length;

    const classAverage = allStudentsWithResults.length
        ? allStudentsWithResults.reduce((sum, item) => sum + item.result.average, 0) /
          allStudentsWithResults.length
        : 0;

    document.getElementById("classAverage").textContent = classAverage.toFixed(2);

    const scholarshipHolders = Array.from(scholarshipMap.values()).filter(
        item => item.scholarshipAmount > 0
    ).length;
    document.getElementById("scholarshipCount").textContent = scholarshipHolders;

    document.getElementById("resultCount").textContent =
        `Hiển thị ${displayedStudents.length} / ${allStudents.length} sinh viên`;
}

export function renderComparisonTable(studentA, studentB, subjects) {
    const rowsHtml = subjects.map(sub => {
        const scoreA = studentA.result.subjectResults.find(s => s.subjectId === sub.id).average;
        const scoreB = studentB.result.subjectResults.find(s => s.subjectId === sub.id).average;
        const diff = scoreA - scoreB;
        const diffText = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);

        return `
            <tr>
                <td class="student-name">${sub.name}</td>
                <td>${scoreA.toFixed(2)}</td>
                <td>${scoreB.toFixed(2)}</td>
                <td><strong>${diffText}</strong></td>
            </tr>
        `;
    }).join("");

    const avgDiff = studentA.result.average - studentB.result.average;
    const avgDiffText = avgDiff > 0 ? `+${avgDiff.toFixed(2)}` : avgDiff.toFixed(2);

    return `
        <table>
            <thead>
                <tr>
                    <th>Môn học / Tiêu chí</th>
                    <th>${studentA.name} (${studentA.id})</th>
                    <th>${studentB.name} (${studentB.id})</th>
                    <th>Chênh lệch (SV1 - SV2)</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
                <tr style="background: #edf3fa;">
                    <td class="student-name">Điểm trung bình học kỳ</td>
                    <td class="average-score">${studentA.result.average.toFixed(2)}</td>
                    <td class="average-score">${studentB.result.average.toFixed(2)}</td>
                    <td class="average-score">${avgDiffText}</td>
                </tr>
            </tbody>
        </table>
    `;
}
