import { loadData } from "./data-loader.js";
import { calculateStudentResult, generateStatistics } from "./grade-calculator.js";

async function initStatistics() {
    const loadingMessage = document.getElementById("loadingMessage");
    const errorMessage = document.getElementById("errorMessage");
    const statsContent = document.getElementById("statsContent");

    try {
        const { students, subjects, grades } = await loadData();
        const gradeMap = new Map(grades.map(g => [g.student_id, g]));
        const studentsWithResults = students
            .map(student => {
                const grade = gradeMap.get(student.id);
                if (!grade) return null;
                return {
                    ...student,
                    result: calculateStudentResult(grade, subjects)
                };
            })
            .filter(Boolean);

        const stats = generateStatistics(studentsWithResults, subjects);
        if (stats.topStudent.length > 0) {
            const firstTop = stats.topStudent.at(0);
            const maxScore = firstTop.result.average;
            const topList = stats.topStudent.filter(
                s => Math.abs(s.result.average - maxScore) < 0.0001
            );
            const names = topList.map(s => `${s.name} (${s.id})`).join(", ");
            document.getElementById("topStudentInfo").textContent =
                `${names} — Điểm TB: ${maxScore.toFixed(2)}`;
        }
        document.getElementById("countGioi").textContent = stats.classificationCounts["Giỏi"];
        document.getElementById("countKha").textContent = stats.classificationCounts["Khá"];
        document.getElementById("countTB").textContent = stats.classificationCounts["Trung bình"];
        document.getElementById("countYeu").textContent = stats.classificationCounts["Yếu"];
        const subjectStatsBody = document.getElementById("subjectStatsBody");
        subjectStatsBody.innerHTML = stats.subjectStats.map(sub => `
            <tr>
                <td>${sub.subjectId}</td>
                <td class="student-name">${sub.subjectName}</td>
                <td class="average-score">${sub.average.toFixed(2)}</td>
                <td>${sub.min.toFixed(2)}</td>
                <td>${sub.max.toFixed(2)}</td>
            </tr>
        `).join("");
        const failedStudentsBody = document.getElementById("failedStudentsBody");
        if (stats.failedStudents.length === 0) {
            failedStudentsBody.innerHTML = `
                <tr>
                    <td colspan="5">Không có sinh viên nào có môn dưới 5.0 điểm.</td>
                </tr>
            `;
        } else {
            failedStudentsBody.innerHTML = stats.failedStudents.map(student => {
                const failedSubjects = student.result.subjectResults
                    .filter(sub => sub.average < 5)
                    .map(sub => `${sub.subjectName} (${sub.average.toFixed(2)})`)
                    .join(", ");

                return `
                    <tr>
                        <td>${student.id}</td>
                        <td class="student-name">${student.name}</td>
                        <td>${student.class}</td>
                        <td style="color: #dc2626; font-weight: 600;">${failedSubjects}</td>
                        <td>${student.result.average.toFixed(2)}</td>
                    </tr>
                `;
            }).join("");
        }

        loadingMessage.hidden = true;
        statsContent.hidden = false;
    } catch (error) {
        loadingMessage.hidden = true;
        errorMessage.hidden = false;
        errorMessage.textContent = error.message;
        console.error(error);
    }
}

initStatistics();
