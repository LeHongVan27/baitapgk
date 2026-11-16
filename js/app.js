import { loadData } from "./data-loader.js";
import { renderStudentList, renderComparisonTable } from "./student-list.js";
import { setupStudentModal } from "./student-modal.js";
import { sortStudentsByName, calculateStudentResult } from "./grade-calculator.js";

async function init() {
    const loadingMessage = document.getElementById("loadingMessage");
    const errorMessage = document.getElementById("errorMessage");
    const searchInput = document.getElementById("searchInput");
    const sortNameButton = document.getElementById("sortNameButton");
    const select1 = document.getElementById("compareStudent1");
    const select2 = document.getElementById("compareStudent2");
    const comparisonResult = document.getElementById("comparisonResult");

    try {
        const { students, subjects, grades } = await loadData();
        let isSortedByName = false;

        const optionsHtml = students
            .map(s => `<option value="${s.id}">${s.id} - ${s.name}</option>`)
            .join("");
        select1.innerHTML += optionsHtml;
        select2.innerHTML += optionsHtml;

        function updateComparison() {
            const id1 = select1.value;
            const id2 = select2.value;

            if (!id1 || !id2) {
                comparisonResult.innerHTML = "";
                return;
            }

            if (id1 === id2) {
                comparisonResult.innerHTML = `<p style="color: #dc2626; font-weight: 600;">Vui lòng chọn hai sinh viên khác nhau để so sánh.</p>`;
                return;
            }

            const student1 = students.find(s => s.id === id1);
            const student2 = students.find(s => s.id === id2);
            const grade1 = grades.find(g => g.student_id === id1);
            const grade2 = grades.find(g => g.student_id === id2);

            if (student1 && student2 && grade1 && grade2) {
                const data1 = { ...student1, result: calculateStudentResult(grade1, subjects) };
                const data2 = { ...student2, result: calculateStudentResult(grade2, subjects) };
                comparisonResult.innerHTML = renderComparisonTable(data1, data2, subjects);
            }
        }

        select1.addEventListener("change", updateComparison);
        select2.addEventListener("change", updateComparison);

        function refreshUI() {
            const keyword = searchInput.value.trim().toLowerCase();
            let list = isSortedByName ? sortStudentsByName(students) : [...students];

            if (keyword) {
                list = list.filter(
                    student =>
                        student.id.toLowerCase().includes(keyword) ||
                        student.name.toLowerCase().includes(keyword)
                );
            }

            renderStudentList(list, subjects, grades, students);
            updateComparison();
        }

        sortNameButton.addEventListener("click", () => {
            isSortedByName = !isSortedByName;
            sortNameButton.textContent = isSortedByName
                ? "Sắp xếp: Theo tên (A-Z) ✓"
                : "Sắp xếp tên (A-Z)";
            sortNameButton.style.background = isSortedByName ? "#dbeafe" : "#f8fafc";
            refreshUI();
        });

        searchInput.addEventListener("input", refreshUI);

        refreshUI();
        setupStudentModal(students, subjects, grades, refreshUI);

        loadingMessage.hidden = true;
    } catch (error) {
        loadingMessage.hidden = true;
        errorMessage.hidden = false;
        errorMessage.textContent = error.message;
        console.error(error);
    }
}

init();
