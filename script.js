const APP_KEY = 'english_class_seating_data';

// Default Data Structure
let appData = {
    students: {
        '5-1': [], '5-2': [], '5-3': [],
        '6-1': [], '6-2': [], '6-3': []
    },
    settings: {
        '5-1': { rows: 5, cols: 6, mode: 'normal', desks: [], arrangement: [], separatedPairs: [] },
        '5-2': { rows: 5, cols: 6, mode: 'normal', desks: [], arrangement: [], separatedPairs: [] },
        '5-3': { rows: 5, cols: 6, mode: 'normal', desks: [], arrangement: [], separatedPairs: [] },
        '6-1': { rows: 5, cols: 6, mode: 'normal', desks: [], arrangement: [], separatedPairs: [] },
        '6-2': { rows: 5, cols: 6, mode: 'normal', desks: [], arrangement: [], separatedPairs: [] },
        '6-3': { rows: 5, cols: 6, mode: 'normal', desks: [], arrangement: [], separatedPairs: [] },
    }
};

let currentClass = '5-1';

// Audio Context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    if (type === 'pop') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'tada') {
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc1.type = 'triangle';
        osc2.type = 'sine';
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc1.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        osc1.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6
        
        osc2.frequency.setValueAtTime(261.63, audioCtx.currentTime); 
        osc2.frequency.setValueAtTime(329.63, audioCtx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        
        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.8);
        osc2.stop(audioCtx.currentTime + 0.8);
    }
}

// Load Data on Initialization
function init() {
    const savedData = localStorage.getItem(APP_KEY);
    if (savedData) {
        try {
            appData = JSON.parse(savedData);
        } catch(e) {
            console.error("데이터 로드 실패", e);
        }
    }
    
    // Check if defaults are missing in loaded array
    if(!appData.students['5-1']) { window.location.reload(); localStorage.clear(); }
    
    bindEvents();
    loadClass(currentClass);
}

function saveData() {
    localStorage.setItem(APP_KEY, JSON.stringify(appData));
    updateStats();
}

// DOM Elements
const classSelect = document.getElementById('class-select');
const uploadInfoBtn = document.getElementById('upload-info-btn');
const excelUploadBtn = document.getElementById('excel-upload');
const manageStudentsBtn = document.getElementById('manage-students-btn');
const manageSeparationBtn = document.getElementById('manage-separation-btn');
const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const updateGridBtn = document.getElementById('update-grid-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const resetSeatsBtn = document.getElementById('reset-seats-btn');
const modeNormal = document.getElementById('mode-normal');
const modeGender = document.getElementById('mode-gender');
const deskGrid = document.getElementById('desk-grid');
const chalkboardClassText = document.getElementById('chalkboard-class-text');
const modeHint = document.getElementById('mode-hint');

// Student Modal
const modal = document.getElementById('student-modal');
const modalCloseBtns = document.querySelectorAll('.close-btn');
const studentTbody = document.getElementById('student-tbody');
const modalClassName = document.getElementById('modal-class-name');
const emptyState = document.getElementById('empty-state');
const clearStudentsBtn = document.getElementById('clear-students-btn');

// Separation Modal
const sepModal = document.getElementById('separation-modal');
const sepModalClassName = document.getElementById('sep-modal-class-name');
const sepStudentA = document.getElementById('sep-student-a');
const sepStudentB = document.getElementById('sep-student-b');
const addSepPairBtn = document.getElementById('add-sep-pair-btn');
const sepPairList = document.getElementById('sep-pair-list');
const sepEmptyState = document.getElementById('sep-empty-state');

function bindEvents() {
    classSelect.addEventListener('change', (e) => {
        currentClass = e.target.value;
        loadClass(currentClass);
    });

    uploadInfoBtn.addEventListener('click', () => {
        Swal.fire({
            title: '엑셀 명단 업로드 안내',
            html: `<div style="text-align:left; font-size:14px; line-height:1.6;">
            엑셀 파일의 첫 번째 행은 반드시 아래와 같은 제목이어야 합니다.<br><br>
            <strong style="color:var(--primary-dark)">[학년, 반, 번호, 이름, 성별]</strong><br><br>
            - 성별은 '남' 또는 '여'로 기입해주세요.<br>
            - 전체 학년/반 명단을 한번에 업로드해도 자동으로 각 반별로 정리됩니다.<br>
            - <span style="color:#e57373; font-weight:bold;">주의: 업로드 시 기존 명단과 자리배치가 모두 초기화 상태가 됩니다.</span>
            </div>`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: '<i class="fa-solid fa-folder-open"></i> 파일 선택하기',
            cancelButtonText: '취소'
        }).then((result) => {
            if (result.isConfirmed) {
                excelUploadBtn.click();
            }
        });
    });

    excelUploadBtn.addEventListener('change', handleExcelUpload);
    manageStudentsBtn.addEventListener('click', () => openModal());
    manageSeparationBtn.addEventListener('click', () => openSepModal());

    modalCloseBtns.forEach(btn => btn.addEventListener('click', () => {
        closeModal();
        closeSepModal();
    }));

    window.addEventListener('click', (e) => {
        if (e.target == modal) closeModal();
        if (e.target == sepModal) closeSepModal();
    });

    clearStudentsBtn.addEventListener('click', () => {
        Swal.fire({
            title: '정말 삭제하시겠습니까?',
            text: "현재 반의 학생 명단이 모두 삭제됩니다.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e57373',
            cancelButtonColor: '#999',
            confirmButtonText: '네, 삭제합니다',
            cancelButtonText: '취소'
        }).then((result) => {
            if (result.isConfirmed) {
                appData.students[currentClass] = [];
                appData.settings[currentClass].arrangement = [];
                // keep desk shape but empty pairs? 
                appData.settings[currentClass].separatedPairs = [];
                saveData();
                renderStudentTable();
                loadClass(currentClass);
                Swal.fire('삭제됨!', '명단이 삭제되었습니다.', 'success');
            }
        });
    });

    updateGridBtn.addEventListener('click', () => {
        const rows = parseInt(rowsInput.value);
        const cols = parseInt(colsInput.value);
        if (rows > 0 && cols > 0 && rows <= 15 && cols <= 15) {
            appData.settings[currentClass].rows = rows;
            appData.settings[currentClass].cols = cols;
            appData.settings[currentClass].desks = new Array(rows * cols).fill(getInitialDeskState());
            appData.settings[currentClass].arrangement = new Array(rows * cols).fill(null);
            saveData();
            renderGrid();
            Swal.fire({ title: '배열 변경됨', icon: 'success', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false});
        }
    });

    shuffleBtn.addEventListener('click', shuffleSeats);
    
    resetSeatsBtn.addEventListener('click', () => {
        appData.settings[currentClass].arrangement = new Array(appData.settings[currentClass].rows * appData.settings[currentClass].cols).fill(null);
        saveData();
        renderGrid();
    });

    modeNormal.addEventListener('change', updateMode);
    modeGender.addEventListener('change', updateMode);
    
    // Separation Modal bindings
    addSepPairBtn.addEventListener('click', () => {
        const a = sepStudentA.value;
        const b = sepStudentB.value;
        if (!a || !b) return;
        if (a === b) {
            Swal.fire('오류', '동일한 학생을 선택할 수 없습니다.', 'error');
            return;
        }
        
        const settings = appData.settings[currentClass];
        if(!settings.separatedPairs) settings.separatedPairs = [];
        
        const exists = settings.separatedPairs.find(p => (p.a === a && p.b === b) || (p.a === b && p.b === a));
        if (exists) {
            Swal.fire('알림', '이미 떨어져 앉기로 등록된 두 학생입니다.', 'info');
            return;
        }
        
        settings.separatedPairs.push({ a, b });
        saveData();
        renderSepPairs();
    });
}

function getInitialDeskState() {
    const mode = appData.settings[currentClass].mode;
    return mode === 'normal' ? 'active' : 'boy';
}

function updateMode() {
    const isNormal = modeNormal.checked;
    const newMode = isNormal ? 'normal' : 'gender';
    
    if (appData.settings[currentClass].mode !== newMode) {
        appData.settings[currentClass].mode = newMode;
        const desks = appData.settings[currentClass].desks;
        for(let i=0; i<desks.length; i++) {
            if(desks[i] !== 'inactive') {
                desks[i] = getInitialDeskState(); 
            }
        }
        appData.settings[currentClass].arrangement = new Array(desks.length).fill(null);
        saveData();
        renderModeHint();
        renderGrid();
    }
}

function loadClass(classId) {
    chalkboardClassText.innerText = classSelect.options[classSelect.selectedIndex].text;
    
    const settings = appData.settings[classId];
    if (!settings.separatedPairs) settings.separatedPairs = [];
    
    rowsInput.value = settings.rows;
    colsInput.value = settings.cols;
    
    if (settings.mode === 'normal') {
        modeNormal.checked = true;
    } else {
        modeGender.checked = true;
    }
    
    renderModeHint();
    
    if (!settings.desks || settings.desks.length !== settings.rows * settings.cols) {
        settings.desks = new Array(settings.rows * settings.cols).fill(getInitialDeskState());
        settings.arrangement = new Array(settings.rows * settings.cols).fill(null);
        saveData();
    }

    renderGrid();
    updateStats();
}

function renderModeHint() {
    const mode = appData.settings[currentClass].mode;
    if (mode === 'normal') {
        modeHint.innerHTML = '<span style="color:var(--desk-active)">● 활성</span> / <span style="color:var(--desk-inactive)">● 비활성(빈자리)</span> 클릭하여 전환';
    } else {
        modeHint.innerHTML = '<span style="color:var(--desk-boy)">● 남자</span> / <span style="color:var(--desk-girl)">● 여자</span> / <span style="color:var(--desk-inactive)">● 비활성</span> 클릭하여 전환';
    }
}

function updateStats() {
    const students = appData.students[currentClass];
    const settings = appData.settings[currentClass];
    let usableDesks = settings.desks.filter(d => d !== 'inactive').length;
    
    document.getElementById('stat-students').innerText = students.length;
    document.getElementById('stat-desks').innerText = usableDesks;
}

function renderGrid() {
    const settings = appData.settings[currentClass];
    const container = document.getElementById('desk-grid');
    
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${settings.cols}, 90px)`;
    
    settings.desks.forEach((state, index) => {
        const desk = document.createElement('div');
        desk.className = `desk-slot desk-${state}`;
        
        const student = settings.arrangement[index];
        if (student) {
            desk.innerHTML = `<span class="student-no">${student.no}.</span><br><span class="student-name">${student.name}</span>`;
        } else {
            desk.innerHTML = '<i class="fa-solid fa-chair" style="font-size: 24px; opacity: 0.3;"></i>';
        }
        
        desk.addEventListener('click', () => {
            handleDeskClick(index);
        });
        
        container.appendChild(desk);
    });
    
    updateStats();
}

function handleDeskClick(index) {
    const settings = appData.settings[currentClass];
    let currentState = settings.desks[index];
    
    if (settings.mode === 'normal') {
        settings.desks[index] = currentState === 'active' ? 'inactive' : 'active';
    } else {
        if (currentState === 'boy') settings.desks[index] = 'girl';
        else if (currentState === 'girl') settings.desks[index] = 'inactive';
        else settings.desks[index] = 'boy';
    }
    
    settings.arrangement[index] = null;
    
    saveData();
    renderGrid();
    playSound('pop');
}

// Generate Arrangement using Random Trials with Constraints
function generateArrangement(mode, students, activeIndices, boyIndices, girlIndices, settings) {
    const MAX_TRIES = 500;
    
    // Check 8-way adjacency
    const getAdjacentIndices = (idx, rows, cols) => {
        let r = Math.floor(idx / cols);
        let c = idx % cols;
        let adj = [];
        for(let dr=-1; dr<=1; dr++){
            for(let dc=-1; dc<=1; dc++){
                if(dr===0 && dc===0) continue;
                let nr = r + dr, nc = c + dc;
                if(nr>=0 && nr<rows && nc>=0 && nc<cols){
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
            
            for(let p = 0; p < pairs.length; p++) {
                let pair = pairs[p];
                if (arr[i].no === pair.a) {
                    for(let a of adj) {
                        if (arr[a] && arr[a].no === pair.b) return false;
                    }
                }
                if (arr[i].no === pair.b) {
                    for(let a of adj) {
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

    for(let t = 0; t < MAX_TRIES; t++) {
        let arr = new Array(settings.rows * settings.cols).fill(null);
        let s = [...students];
        
        let act = [...activeIndices];
        let boyAct = [...boyIndices];
        let girlAct = [...girlIndices];

        shuffleArray(s);
        
        if (mode === 'normal') {
            shuffleArray(act);
            for(let i=0; i<s.length; i++) {
                arr[act[i]] = s[i];
            }
        } else {
            const boys = s.filter(st => st.gender === '남');
            const girls = s.filter(st => st.gender === '여');
            shuffleArray(boyAct);
            shuffleArray(girlAct);
            for(let i=0; i<boys.length; i++) {
                arr[boyAct[i]] = boys[i];
            }
            for(let i=0; i<girls.length; i++) {
                arr[girlAct[i]] = girls[i];
            }
        }
        
        if (checkConstraints(arr)) {
            return arr;
        }
    }
    return null; // Failed to find satisfying arrangement
}

function shuffleSeats() {
    const students = [...appData.students[currentClass]];
    if (students.length === 0) {
        Swal.fire('학생 명단이 없습니다', '엑셀 명단을 업로드해주세요.', 'warning');
        return;
    }

    const settings = appData.settings[currentClass];
    const mode = settings.mode;
    
    let activeIndices = [];
    let boyIndices = [];
    let girlIndices = [];
    
    settings.desks.forEach((state, idx) => {
        if (state !== 'inactive') activeIndices.push(idx);
        if (state === 'boy') boyIndices.push(idx);
        if (state === 'girl') girlIndices.push(idx);
    });

    if (mode === 'normal') {
        if (activeIndices.length < students.length) {
            Swal.fire('책상 수 부족!', `학생은 ${students.length}명인데 활성화된 자리는 ${activeIndices.length}개입니다.`, 'error');
            return;
        }
    } else {
        const boys = students.filter(s => s.gender === '남');
        const girls = students.filter(s => s.gender === '여');
        if (boyIndices.length < boys.length || girlIndices.length < girls.length) {
            Swal.fire('남/녀 책상 수 부족!', `남자석 ${boyIndices.length}개(필요:${boys.length}), 여자석 ${girlIndices.length}개(필요:${girls.length})`, 'error');
            return;
        }
    }

    shuffleBtn.disabled = true;
    shuffleBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 섞는중...';
    
    setTimeout(() => {
        settings.arrangement = new Array(settings.rows * settings.cols).fill(null);
        
        const resultArrangement = generateArrangement(mode, students, activeIndices, boyIndices, girlIndices, settings);
        
        if (!resultArrangement) {
            Swal.fire('자리 배치 실패', '짝꿍 금지 조건이 너무 많거나 자리가 비좁아 조건을 만족하는 배치를 찾지 못했습니다.<br>제약을 줄이고 다시 시도해주세요.', 'error');
            shuffleBtn.disabled = false;
            shuffleBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> 자리 바꾸기!';
            return;
        }
        
        settings.arrangement = resultArrangement;
        saveData();
        renderGrid();
        
        const desks = document.querySelectorAll('.desk-slot');
        desks.forEach(desk => {
            if(desk.querySelector('.student-name')) {
                desk.classList.add('animate__animated', 'animate__bounceIn');
            }
        });
        
        playSound('tada');
        
        shuffleBtn.disabled = false;
        shuffleBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> 자리 바꾸기!';
        
    }, 400); // 400ms loading effect
}

// --- Excel and Management ---

function handleExcelUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const json = XLSX.utils.sheet_to_json(worksheet, {header: 1, defval: ""});
        
        if (json.length <= 1) {
            Swal.fire('에러', '엑셀 파일이 비어있거나 데이터가 없습니다.', 'error');
            return;
        }

        const headers = json[0];
        const gIdx = headers.findIndex(h => h && h.toString().includes('학년'));
        const cIdx = headers.findIndex(h => h && h.toString().includes('반'));
        const nIdx = headers.findIndex(h => h && h.toString().includes('번호'));
        const nameIdx = headers.findIndex(h => h && h.toString().includes('이름'));
        const sexIdx = headers.findIndex(h => h && h.toString().includes('성별'));

        if(nIdx === -1 || nameIdx === -1) {
            Swal.fire('형식 오류', '헤더에 최소한 "번호", "이름" 열이 존재해야 합니다.', 'error');
            return;
        }

        let addedCount = 0;
        let studentsObj = {...appData.students}; 

        for (let i = 1; i < json.length; i++) {
            const row = json[i];
            if (!row[nIdx] && !row[nameIdx]) continue; 
            
            let grade = gIdx !== -1 ? row[gIdx] : '5';
            let cRoom = cIdx !== -1 ? row[cIdx] : '1';
            let no = row[nIdx];
            let name = row[nameIdx];
            let gender = sexIdx !== -1 ? row[sexIdx] : '남';
            
            if (gender.toString().includes('여') || gender.toLowerCase() === 'f' || gender.toLowerCase() === 'girl') {
                gender = '여';
            } else {
                gender = '남';
            }

            const classKey = `${grade}-${cRoom}`;
            
            if (!studentsObj[classKey]) {
                if (['5-1','5-2','5-3','6-1','6-2','6-3'].includes(classKey)) {
                     studentsObj[classKey] = [];
                } else {
                    continue;
                }
            }
            
            studentsObj[classKey].push({ grade, classRoom: cRoom, no: no.toString(), name, gender });
            addedCount++;
        }

        if (addedCount > 0) {
            for (let key in studentsObj) {
                studentsObj[key].sort((a,b) => parseInt(a.no) - parseInt(b.no));
            }
            appData.students = studentsObj;
            for (let key in appData.settings) {
                appData.settings[key].arrangement = new Array(appData.settings[key].rows * appData.settings[key].cols).fill(null);
                appData.settings[key].separatedPairs = []; // Reset separation pairs safely
            }
            saveData();
            loadClass(currentClass);
            Swal.fire('업로드 성공!', `총 ${addedCount}명의 데이터를 불러왔습니다.`, 'success');
        } else {
            Swal.fire('데이터 없음', '가져올 데이터가 없거나 형식에 맞지 않습니다.', 'warning');
        }
    };
    reader.readAsArrayBuffer(file);
    excelUploadBtn.value = ''; 
}

function openModal() {
    modalClassName.innerText = classSelect.options[classSelect.selectedIndex].text;
    renderStudentTable();
    modal.classList.add('show');
}

function closeModal() {
    modal.classList.remove('show');
}

function renderStudentTable() {
    studentTbody.innerHTML = '';
    const students = appData.students[currentClass];
    
    if (students.length === 0) {
        studentTbody.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        studentTbody.style.display = 'table-row-group';
        emptyState.style.display = 'none';
        
        students.forEach((s, idx) => {
            const tr = document.createElement('tr');
            const gBadgeClass = s.gender === '남' ? 'gender-boy' : 'gender-girl';
            tr.innerHTML = `
                <td>${s.grade}</td>
                <td>${s.classRoom}</td>
                <td>${s.no}</td>
                <td><strong>${s.name}</strong></td>
                <td><span class="gender-badge ${gBadgeClass}">${s.gender}</span></td>
                <td><button class="delete-row-btn" data-idx="${idx}"><i class="fa-solid fa-trash"></i></button></td>
            `;
            studentTbody.appendChild(tr);
        });

        document.querySelectorAll('.delete-row-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('data-idx');
                appData.students[currentClass].splice(idx, 1);
                appData.settings[currentClass].arrangement = new Array(appData.settings[currentClass].rows * appData.settings[currentClass].cols).fill(null);
                saveData();
                renderStudentTable();
                loadClass(currentClass); 
            });
        });
    }
}

// Separation Modal Functions
function openSepModal() {
    sepModalClassName.innerText = classSelect.options[classSelect.selectedIndex].text;
    const students = appData.students[currentClass];
    
    sepStudentA.innerHTML = '<option value="">선택</option>';
    sepStudentB.innerHTML = '<option value="">선택</option>';
    
    students.forEach(s => {
        const option = `<option value="${s.no}">${s.no}번 ${s.name}</option>`;
        sepStudentA.innerHTML += option;
        sepStudentB.innerHTML += option;
    });
    
    renderSepPairs();
    sepModal.classList.add('show');
}

function closeSepModal() {
    sepModal.classList.remove('show');
}

function renderSepPairs() {
    sepPairList.innerHTML = '';
    const pairs = appData.settings[currentClass].separatedPairs || [];
    const students = appData.students[currentClass];
    
    if (pairs.length === 0) {
        sepPairList.style.display = 'none';
        sepEmptyState.style.display = 'block';
    } else {
        sepPairList.style.display = 'block';
        sepEmptyState.style.display = 'none';
        
        pairs.forEach((p, idx) => {
            const stuA = students.find(s => s.no === p.a);
            const stuB = students.find(s => s.no === p.b);
            
            const nameA = stuA ? `${stuA.no}번 ${stuA.name}` : `알수없음(${p.a})`;
            const nameB = stuB ? `${stuB.no}번 ${stuB.name}` : `알수없음(${p.b})`;
            
            const li = document.createElement('li');
            li.style.cssText = 'background:#f4ece6; margin-bottom: 5px; padding: 10px 15px; border-radius: 8px; display:flex; justify-content:space-between; align-items:center;';
            li.innerHTML = `
                <span><i class="fa-solid fa-user-slash" style="color:#e57373; margin-right:8px;"></i> ${nameA} <strong style="color:#aaa;">&amp;</strong> ${nameB}</span>
                <button class="delete-sep-btn" data-idx="${idx}" style="background:none; border:none; color:#999; cursor:pointer;"><i class="fa-solid fa-times"></i></button>
            `;
            sepPairList.appendChild(li);
        });
        
        document.querySelectorAll('.delete-sep-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('data-idx');
                appData.settings[currentClass].separatedPairs.splice(idx, 1);
                saveData();
                renderSepPairs();
            });
        });
    }
}

// Boot up
window.onload = init;
