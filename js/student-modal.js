import {
    calculateStudentResult,
    calculateScholarships,
    formatCurrency
} from "./grade-calculator.js";

export function setupStudentModal(students, subjects, grades, onUpdateCallback) {
    const modal = document.getElementById("studentModal");
    const detail = document.getElementById("studentDetail");
    const tableBody = document.getElementById("studentTableBody");

    function closeModal() {
        modal.hidden = true;
    }

    function renderModalContent(student, grade) {
        const gradeMap = new Map(grades.map(g => [g.student_id, g]));
        const allWithResults = students
            .map(s => {
                const g = gradeMap.get(s.id);
                return g ? { ...s, result: calculateStudentResult(g, subjects) } : null;
            })
            .filter(Boolean);

        const scholarshipMap = calculateScholarships(allWithResults);
        const info = scholarshipMap.get(student.id);
        const { result, rank, scholarshipGroup, scholarshipAmount } = info;

        detail.innerHTML = `
            <div class="student-info">
                <p><strong>Mã sinh viên:</strong> ${student.id}</p>
                <p><strong>Họ và tên:</strong> ${student.name}</p>
                <p><strong>Lớp:</strong> ${student.class}</p>
                <p><strong>Email:</strong> ${student.email}</p>
            </div>

            <h3>Chi tiết & Chỉnh sửa điểm các môn</h3>

            <div class="table-wrapper">
                <table class="detail-table">
                    <thead>
                        <tr>
                            <th>Môn học</th>
                            <th>Chuyên cần</th>
                            <th>Giữa kỳ</th>
                            <th>Cuối kỳ</th>
                            <th>Điểm TB</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${result.subjectResults.map(item => `
                        <tr data-subject-id="${item.subjectId}">
                            <td class="student-name">${item.subjectName}</td>
                            <td>
                                <input type="number" class="score-input" min="0" max="10" step="0.1"
                                    value="${item.scores[0]}" style="width: 70px; padding: 6px; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px;">
                            </td>
                            <td>
                                <input type="number" class="score-input" min="0" max="10" step="0.1"
                                    value="${item.scores[1]}" style="width: 70px; padding: 6px; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px;">
                            </td>
                            <td>
                                <input type="number" class="score-input" min="0" max="10" step="0.1"
                                    value="${item.scores[2]}" style="width: 70px; padding: 6px; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px;">
                            </td>
                            <td class="average-score">${item.average.toFixed(2)}</td>
                        </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 16px; display: flex; justify-content: flex-end; gap: 10px;">
                <button id="saveScoresBtn" type="button" class="detail-button" style="background: #16a34a; padding: 10px 18px; font-weight: 600;">
                    Lưu điểm mới
                </button>
            </div>

            <div class="result-summary">
                <p><strong>Điểm trung bình học kỳ:</strong> ${result.average.toFixed(2)}</p>
                <p><strong>Xếp loại:</strong> ${result.classification}</p>
                <p><strong>Thứ hạng học bổng:</strong> #${rank} (${scholarshipGroup})</p>
                <p><strong>Số tiền học bổng:</strong> ${formatCurrency(scholarshipAmount)}</p>
            </div>
        `;

        document.getElementById("saveScoresBtn").addEventListener("click", () => {
            const rows = detail.querySelectorAll("tbody tr");
            let isValid = true;

            rows.forEach(row => {
                const subjectId = row.dataset.subjectId;
                const inputs = row.querySelectorAll(".score-input");
                const newScores = Array.from(inputs).map(input => parseFloat(input.value));

                if (newScores.some(val => isNaN(val) || val < 0 || val > 10)) {
                    isValid = false;
                    return;
                }

                grade.scores[subjectId] = newScores;
            });

            if (!isValid) {
                alert("Vui lòng nhập điểm hợp lệ từ 0 đến 10!");
                return;
            }
            renderModalContent(student, grade);
            if (onUpdateCallback) {
                onUpdateCallback();
            }
        });
    }

    tableBody.addEventListener("click", event => {
        const button = event.target.closest("[data-student-id]");
        if (!button) return;

        const student = students.find(item => item.id === button.dataset.studentId);
        const grade = grades.find(item => item.student_id === button.dataset.studentId);

        if (!student || !grade) return;

        renderModalContent(student, grade);
        modal.hidden = false;
    });

    document.getElementById("closeModal").addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
        if (event.target.hasAttribute("data-close-modal")) {
            closeModal();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });
}
