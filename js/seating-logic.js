function getBuddySeatIndex(idx, cols) {
    const rowStart = idx - (idx % cols);
    const col = idx % cols;
    const buddyCol = col % 2 === 0 ? col + 1 : col - 1;

    if (buddyCol < 0 || buddyCol >= cols) return -1;
    return rowStart + buddyCol;
}

function buildHistoryConstraints(history, cols) {
    if (!history || history.length === 0) return null;

    const forbiddenSeats = {};
    const forbiddenPartners = {};

    history.forEach(entry => {
        if (!entry.arrangement) return;

        entry.arrangement.forEach((student, idx) => {
            if (!student) return;
            if (!forbiddenSeats[student.no]) forbiddenSeats[student.no] = new Set();
            forbiddenSeats[student.no].add(idx);
        });

        entry.arrangement.forEach((student, idx) => {
            if (!student) return;
            const buddyIdx = getBuddySeatIndex(idx, cols);
            const buddy = entry.arrangement[buddyIdx];
            if (!buddy) return;
            if (!forbiddenPartners[student.no]) forbiddenPartners[student.no] = new Set();
            forbiddenPartners[student.no].add(buddy.no);
        });
    });

    return {
        seats: forbiddenSeats,
        partners: forbiddenPartners
    };
}

// Generate Arrangement using Random Trials with Constraints
function generateArrangement(mode, students, activeIndices, boyIndices, girlIndices, settings, historyConstraints) {
    const MAX_TRIES = 500;

    // historyConstraints.seats: { studentNo -> Set of indices } - history-based forbidden seats
    // historyConstraints.partners: { studentNo -> Set of studentNo } - history-based forbidden buddies
    const checkHistoryConstraint = (arr) => {
        if (!historyConstraints) return true;
        const forbiddenSeats = historyConstraints.seats;
        const forbiddenPartners = historyConstraints.partners;

        for (let i = 0; i < arr.length; i++) {
            if (!arr[i]) continue;
            const forbidden = forbiddenSeats[arr[i].no];
            if (forbidden && forbidden.has(i)) return false;

            const buddyIdx = getBuddySeatIndex(i, settings.cols);
            const buddy = arr[buddyIdx];
            const forbiddenBuddy = forbiddenPartners[arr[i].no];
            if (buddy && forbiddenBuddy && forbiddenBuddy.has(buddy.no)) return false;
        }
        return true;
    };

    // Check 8-way adjacency
    const getAdjacentIndices = (idx, rows, cols) => {
        let r = Math.floor(idx / cols);
        let c = idx % cols;
        let adj = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                let nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    adj.push(nr * cols + nc);
                }
            }
        }
        return adj;
    };

    const pairs = settings.separatedPairs || [];

    const checkConstraints = (arr) => {
        if (pairs.length === 0) return true;
        for (let i = 0; i < arr.length; i++) {
            if (!arr[i]) continue;
            let adj = getAdjacentIndices(i, settings.rows, settings.cols);

            for (let p = 0; p < pairs.length; p++) {
                let pair = pairs[p];
                if (arr[i].no === pair.a) {
                    for (let a of adj) {
                        if (arr[a] && arr[a].no === pair.b) return false;
                    }
                }
                if (arr[i].no === pair.b) {
                    for (let a of adj) {
                        if (arr[a] && arr[a].no === pair.a) return false;
                    }
                }
            }
        }
        return true;
    };

    const shuffleArray = (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    };

    for (let t = 0; t < MAX_TRIES; t++) {
        let arr = new Array(settings.rows * settings.cols).fill(null);
        let s = [...students];

        let act = [...activeIndices];
        let boyAct = [...boyIndices];
        let girlAct = [...girlIndices];

        shuffleArray(s);

        if (mode === 'normal') {
            shuffleArray(act);
            for (let i = 0; i < s.length; i++) {
                arr[act[i]] = s[i];
            }
        } else {
            const boys = s.filter(st => st.gender === '남');
            const girls = s.filter(st => st.gender === '여');
            shuffleArray(boyAct);
            shuffleArray(girlAct);
            for (let i = 0; i < boys.length; i++) {
                arr[boyAct[i]] = boys[i];
            }
            for (let i = 0; i < girls.length; i++) {
                arr[girlAct[i]] = girls[i];
            }
        }

        if (checkConstraints(arr) && checkHistoryConstraint(arr)) {
            return arr;
        }
    }
    return null; // Failed to find satisfying arrangement
}
