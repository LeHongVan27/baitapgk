const WEIGHTS = {
    attendance: 0.1,
    midterm: 0.4,
    final: 0.5
};

export function calculateSubjectAverage(scores) {
    const [attendance, midterm, final] = scores;

    return (
        attendance * WEIGHTS.attendance +
        midterm * WEIGHTS.midterm +
        final * WEIGHTS.final
    );
}

export function calculateStudentResult(grade, subjects) {
    const subjectResults = subjects.map(subject => {
        const scores = grade.scores[subject.id];

        return {
            subjectId: subject.id,
            subjectName: subject.name,
            scores,
            average: calculateSubjectAverage(scores)
        };
    });

    const average =
        subjectResults.reduce((sum, item) => sum + item.average, 0) /
        subjectResults.length;

    let classification;

    if (average >= 8.5) {
        classification = "Giỏi";
    } else if (average >= 7) {
        classification = "Khá";
    } else if (average >= 5) {
        classification = "Trung bình";
    } else {
        classification = "Yếu";
    }

    return {
        subjectResults,
        average,
        classification
    };
}

function splitVietnameseName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts.pop() || "";
    const lastAndMiddleName = parts.join(" ");
    return { firstName, lastAndMiddleName };
}

export function sortStudentsByName(students) {
    return [...students].sort((a, b) => {
        const nameA = splitVietnameseName(a.name);
        const nameB = splitVietnameseName(b.name);

        const compareFirst = nameA.firstName.localeCompare(nameB.firstName, "vi");
        if (compareFirst !== 0) return compareFirst;

        return nameA.lastAndMiddleName.localeCompare(nameB.lastAndMiddleName, "vi");
    });
}

export function calculateScholarships(students) {
    const TOTAL_FUND = 100000000;
    const total = students.length;

    const sorted = [...students].sort((a, b) => {
        if (b.result.average !== a.result.average) {
            return b.result.average - a.result.average;
        }
        return a.id.localeCompare(b.id);
    });

    const top10Count = Math.ceil(total * 0.1);
    const top30Count = Math.ceil(total * 0.3);
    const top50Count = Math.ceil(total * 0.5);

    const group1Size = top10Count;
    const group2Size = Math.max(0, top30Count - top10Count);
    const group3Size = Math.max(0, top50Count - top30Count);

    const distributeGroup = (groupItems, groupFund, groupName) => {
        if (groupItems.length === 0) return [];
        const baseAmount = Math.floor(groupFund / groupItems.length / 1000) * 1000;
        let remainder = groupFund - baseAmount * groupItems.length;

        return groupItems.map(item => {
            let extra = 0;
            if (remainder >= 1000) {
                extra = 1000;
                remainder -= 1000;
            }
            return {
                ...item,
                scholarshipGroup: groupName,
                scholarshipAmount: baseAmount + extra
            };
        });
    };

    const g1 = distributeGroup(sorted.slice(0, group1Size), TOTAL_FUND * 0.4, "Top 10% (Nhóm 1)");
    const g2 = distributeGroup(sorted.slice(group1Size, top30Count), TOTAL_FUND * 0.4, "Top 10% - 30% (Nhóm 2)");
    const g3 = distributeGroup(sorted.slice(top30Count, top50Count), TOTAL_FUND * 0.2, "Top 30% - 50% (Nhóm 3)");
    const g4 = sorted.slice(top50Count).map(item => ({
        ...item,
        scholarshipGroup: "Ngoài Top 50%",
        scholarshipAmount: 0
    }));

    const rankedList = [...g1, ...g2, ...g3, ...g4].map((item, index) => ({
        ...item,
        rank: index + 1
    }));

    return new Map(rankedList.map(item => [item.id, item]));
}

export function generateStatistics(studentsWithResults, subjects) {
    const topStudent = [...studentsWithResults].sort(
        (a, b) => b.result.average - a.result.average
    );

    const classificationCounts = { "Giỏi": 0, "Khá": 0, "Trung bình": 0, "Yếu": 0 };
    studentsWithResults.forEach(s => {
        classificationCounts[s.result.classification]++;
    });

    const failedStudents = studentsWithResults.filter(s =>
        s.result.subjectResults.some(sub => sub.average < 5)
    );

    const subjectStats = subjects.map(subject => {
        const scores = studentsWithResults.map(s => {
            const subRes = s.result.subjectResults.find(r => r.subjectId === subject.id);
            return subRes ? subRes.average : 0;
        });

        const sum = scores.reduce((acc, val) => acc + val, 0);
        return {
            subjectId: subject.id,
            subjectName: subject.name,
            average: scores.length ? sum / scores.length : 0,
            min: scores.length ? Math.min(...scores) : 0,
            max: scores.length ? Math.max(...scores) : 0
        };
    });

    return { topStudent, classificationCounts, failedStudents, subjectStats };
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(amount);
}
