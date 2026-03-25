const STORAGE_KEY = 'fitness_tracker_v1';

function defaultDay() {
  return {
    meals: {
      breakfast: { skipped:false, items:[] },
      lunch:     { skipped:false, items:[] },
      dinner:    { skipped:false, items:[] },
      junk:      { skipped:false, items:[] }
    },
    water: { consumedMl: 0, goalMl: 2000 },
    maintenance: null,
    deficit: { min:10, max:15, _userSet:false },
    weightKg: null,
    steps: null,
    nofap: false
  };
}

function getDateKey(date = new Date()){
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function readStore(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){
    console.error('Failed to read store', e);
    return {};
  }
}
function writeStore(store){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
function getDay(key){
  const store = readStore();
  if(!store[key]) store[key] = defaultDay();
  if(!('deficit' in store[key])) store[key].deficit = { min:10, max:15, _userSet:false };
  if(typeof store[key].deficit._userSet === 'undefined') store[key].deficit._userSet = false;
  return store[key];
}
function saveDay(key, dayObj){
  const store = readStore();
  store[key] = dayObj;
  writeStore(store);
}

const datePicker = document.getElementById('datePicker');
const todayBtn = document.getElementById('todayBtn');
const prevDayBtn = document.getElementById('prevDay');
const nextDayBtn = document.getElementById('nextDay');
const dateLabel = document.getElementById('dateLabel');

const mealsContainer = document.getElementById('mealsContainer');
const totalCaloriesEl = document.getElementById('totalCalories');
const totalProteinEl = document.getElementById('totalProtein');
const totalCarbsEl = document.getElementById('totalCarbs');
const totalFatsEl = document.getElementById('totalFats');
const maintenanceInput = document.getElementById('maintenanceInput');
const defMin = document.getElementById('defMin');
const defMax = document.getElementById('defMax');
const applyDeficitBtn = document.getElementById('applyDeficit');
const calorieStatus = document.getElementById('calorieStatus');

const add250 = document.getElementById('add250');
const sub250 = document.getElementById('sub250');
const waterCustom = document.getElementById('waterCustom');
const setWaterGoal = document.getElementById('setWaterGoal');
const waterFill = document.getElementById('waterFill');
const waterText = document.getElementById('waterText');
const waterAnim = document.getElementById('waterAnim');

const weightInput = document.getElementById('weightInput');
const saveWeight = document.getElementById('saveWeight');
const weightSaved = document.getElementById('weightSaved');
const stepsInput = document.getElementById('stepsInput');
const saveSteps = document.getElementById('saveSteps');
const stepsSaved = document.getElementById('stepsSaved');

const calendarEl = document.getElementById('calendar');
const historyTableBody = document.querySelector('#historyTable tbody');

const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const clearBtn = document.getElementById('clearBtn');

const nofapStreakEl = document.getElementById('habitStreak');
const nofapToggle = document.getElementById('habitToggle');
const nofapReset = document.getElementById('habitReset');

let selectedDateKey = getDateKey();
datePicker.value = selectedDateKey;

const MEAL_KEYS = ['breakfast','lunch','dinner','junk'];

function createMealCards(){
  mealsContainer.innerHTML = '';
  MEAL_KEYS.forEach(mealKey=>{
    const card = document.createElement('div');
    card.className = 'meal card';
    card.dataset.meal = mealKey;
    card.innerHTML = `
      <h3>
        <span style="text-transform:capitalize">${mealKey}</span>
        <div>
          <button class="small ghost skipBtn">Skip</button>
          <button class="small addBtn">Add</button>
        </div>
      </h3>
      <div class="food-list" data-list></div>
      <div style="display:flex;gap:8px;margin-top:8px;align-items:center">
        <input class="foodName" type="text" placeholder="Food name" />
        <input class="foodQty quantity" type="text" placeholder="qty (e.g., 1 cup)" />
        <input class="foodCals" type="number" placeholder="kcal" style="width:90px" />
        <input class="foodProtein" type="number" placeholder="P g" style="width:70px" />
        <input class="foodCarbs" type="number" placeholder="C g" style="width:70px" />
        <input class="foodFats" type="number" placeholder="F g" style="width:70px" />
      </div>
    `;
    mealsContainer.appendChild(card);
  });
}

function renderMeals(){
  const day = getDay(selectedDateKey);
  MEAL_KEYS.forEach(key=>{
    const card = mealsContainer.querySelector(`[data-meal="${key}"]`);
    const list = card.querySelector('[data-list]');
    list.innerHTML = '';
    const meal = day.meals[key];
    if(meal.items.length === 0){
      list.innerHTML = '<div class="muted">No items</div>';
    }else{
      meal.items.forEach((it, idx)=>{
        const el = document.createElement('div');
        el.className = 'food-item';
        el.innerHTML = `
          <div>
            <div style="font-weight:600">${escapeHtml(it.name)} <span class="muted">(${escapeHtml(it.quantity||'')})</span></div>
            <div class="muted" style="font-size:0.85rem">${it.protein}P • ${it.carbs}C • ${it.fats}F</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700">${it.calories} kcal</div>
            <div style="margin-top:6px">
              <button class="small ghost editBtn">Edit</button>
              <button class="small" data-remove>Remove</button>
            </div>
          </div>
        `;
        if(meal.skipped) el.classList.add('skipped');
        list.appendChild(el);

        el.querySelector('[data-remove]').addEventListener('click', ()=>{
          meal.items.splice(idx,1);
          saveDay(selectedDateKey, day);
          updateAll();
        });
        el.querySelector('.editBtn').addEventListener('click', ()=>{
          const nameIn = card.querySelector('.foodName');
          const qtyIn = card.querySelector('.foodQty');
          const calsIn = card.querySelector('.foodCals');
          const pIn = card.querySelector('.foodProtein');
          const cIn = card.querySelector('.foodCarbs');
          const fIn = card.querySelector('.foodFats');
          nameIn.value = it.name;
          qtyIn.value = it.quantity || '';
          calsIn.value = it.calories;
          pIn.value = it.protein;
          cIn.value = it.carbs;
          fIn.value = it.fats;
          meal.items.splice(idx,1);
          saveDay(selectedDateKey, day);
          updateAll();
        });
      });
    }

    const skipBtn = card.querySelector('.skipBtn');
    skipBtn.textContent = meal.skipped ? 'Unskip' : 'Skip';
    skipBtn.onclick = ()=>{
      meal.skipped = !meal.skipped;
      saveDay(selectedDateKey, day);
      updateAll();
    };

    const addBtn = card.querySelector('.addBtn');
    addBtn.onclick = ()=>{
      const nameIn = card.querySelector('.foodName');
      const qtyIn = card.querySelector('.foodQty');
      const calsIn = card.querySelector('.foodCals');
      const pIn = card.querySelector('.foodProtein');
      const cIn = card.querySelector('.foodCarbs');
      const fIn = card.querySelector('.foodFats');
      const name = nameIn.value.trim();
      const quantity = qtyIn.value.trim();
      const calories = Number(calsIn.value) || 0;
      const protein = Number(pIn.value) || 0;
      const carbs = Number(cIn.value) || 0;
      const fats = Number(fIn.value) || 0;
      if(!name) return alert('Enter food name');
      meal.items.push({ name, quantity, calories, protein, carbs, fats });
      nameIn.value = ''; qtyIn.value=''; calsIn.value=''; pIn.value=''; cIn.value=''; fIn.value='';
      saveDay(selectedDateKey, day);
      updateAll();
    };
  });
}

function calculateTotals(day){
  let cals=0, p=0, carbs=0, fats=0;
  MEAL_KEYS.forEach(k=>{
    const meal = day.meals[k];
    if(!meal.skipped){
      meal.items.forEach(it=>{
        cals += Number(it.calories) || 0;
        p += Number(it.protein) || 0;
        carbs += Number(it.carbs) || 0;
        fats += Number(it.fats) || 0;
      });
    }
  });
  return { calories: Math.round(cals), protein: Math.round(p), carbs: Math.round(carbs), fats: Math.round(fats) };
}

function updateCalorieStatus(day, totals){
  const maintenance = day.maintenance || Number(maintenanceInput.value) || null;
  const defMinVal = Number(day.deficit?.min ?? defMin.value) || Number(defMin.value);
  const defMaxVal = Number(day.deficit?.max ?? defMax.value) || Number(defMax.value);
  if(maintenance){
    const low = Math.round(maintenance * (1 - defMaxVal/100));
    const high = Math.round(maintenance * (1 - defMinVal/100));
    const cals = totals.calories;
    calorieStatus.textContent = `${cals} kcal (target ${low}–${high})`;
    if(cals < low) {
      calorieStatus.style.color = 'var(--success)';
      calorieStatus.title = 'Below target range';
    } else if(cals <= high) {
      calorieStatus.style.color = '#f59e0b';
      calorieStatus.title = 'Within target range';
    } else {
      calorieStatus.style.color = 'var(--danger)';
      calorieStatus.title = 'Above target range';
    }
  } else {
    calorieStatus.textContent = 'Set maintenance calories';
    calorieStatus.style.color = 'var(--muted)';
  }
}

function updateWaterUI(day){
  const consumed = day.water.consumedMl || 0;
  const goal = day.water.goalMl || 2000;
  const pct = Math.min(100, Math.round((consumed/goal)*100));
  waterFill.style.width = pct + '%';
  waterText.textContent = `${consumed} / ${goal} ml`;
  if(consumed >= goal){
    waterFill.classList.add('goal-hit');
    waterAnim.textContent = 'Goal reached 🎉';
    setTimeout(()=> waterFill.classList.remove('goal-hit'), 1200);
  } else {
    waterAnim.textContent = '';
  }
}

function renderCalendar(){
  calendarEl.innerHTML = '';
  const selDate = new Date(selectedDateKey);
  const year = selDate.getFullYear();
  const month = selDate.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  for(let i=0;i<startDay;i++){
    const blank = document.createElement('div');
    blank.className = 'day';
    blank.style.visibility = 'hidden';
    calendarEl.appendChild(blank);
  }
  const store = readStore();
  for(let d=1; d<=daysInMonth; d++){
    const key = getDateKey(new Date(year, month, d));
    const dayObj = store[key] || null;
    const el = document.createElement('div');
    el.className = 'day';
    el.textContent = d;
    if(dayObj && hasAnyData(dayObj)) el.classList.add('has-data');
    el.onclick = ()=>{
      selectedDateKey = key;
      datePicker.value = selectedDateKey;
      updateAll();
    };
    calendarEl.appendChild(el);
  }
}

function hasAnyData(dayObj){
  if(!dayObj) return false;
  if(dayObj.weightKg || dayObj.steps) return true;
  if(dayObj.nofap) return true;
  if((dayObj.water && (dayObj.water.consumedMl>0))) return true;
  for(const k of MEAL_KEYS){
    if(dayObj.meals[k] && dayObj.meals[k].items.length>0) return true;
  }
  if(dayObj.deficit && dayObj.deficit._userSet) return true;
  return false;
}

function updateDateLabel(){
  const todayKey = getDateKey();
  if(selectedDateKey === todayKey){
    dateLabel.textContent = 'Today';
  } else {
    const d = new Date(selectedDateKey);
    dateLabel.textContent = d.toLocaleDateString();
  }
}

function renderHistory(){
  historyTableBody.innerHTML = '';
  const store = readStore();
  const keys = Object.keys(store).sort((a,b)=>b.localeCompare(a));
  let count = 0;
  for(const key of keys){
    if(count >= 30) break;
    const day = store[key];
    if(day.weightKg === null && (day.steps === null || day.steps === undefined)) continue;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${key}</td><td>${day.weightKg ?? '—'}</td><td>${day.steps ?? '—'}</td><td><button class="small ghost editRow">Edit</button></td>`;
    historyTableBody.appendChild(tr);
    tr.querySelector('.editRow').addEventListener('click', ()=>{
      selectedDateKey = key;
      datePicker.value = selectedDateKey;
      updateAll();
      weightInput.value = day.weightKg ?? '';
      stepsInput.value = day.steps ?? '';
    });
    count++;
  }
}

function computeNoFapStreakForDate(dateKey){
  const store = readStore();
  let streak = 0;
  let cur = new Date(dateKey);
  while(true){
    const key = getDateKey(cur);
    const day = store[key];
    if(day && day.nofap){
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else break;
  }
  return streak;
}

function updateNoFapUI(){
  const store = readStore();
  const day = getDay(selectedDateKey);
  const streak = computeNoFapStreakForDate(selectedDateKey);
  nofapStreakEl.textContent = `${streak} 🔥`;
  nofapToggle.textContent = day.nofap ? 'Unmark Day' : 'Mark Day';
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function setDeficitForDate(key, min, max, userSet = true){
  const day = getDay(key);
  day.deficit = { min: Number(min), max: Number(max), _userSet: !!userSet };
  saveDay(key, day);
}

function propagateDeficitFrom(startKey, min, max){
  setDeficitForDate(startKey, min, max, true);

  let cur = new Date(startKey);
  for(let i=0;i<730;i++){
    cur.setDate(cur.getDate() + 1);
    const key = getDateKey(cur);
    const store = readStore();
    const existing = store[key];
    if(existing && existing.deficit && existing.deficit._userSet){
      break;
    }
    const day = getDay(key);
    day.deficit = { min: Number(min), max: Number(max), _userSet: false };
    saveDay(key, day);
  }
}

function updateAll(){
  const day = getDay(selectedDateKey);
  maintenanceInput.value = day.maintenance ?? maintenanceInput.value;
  defMin.value = day.deficit?.min ?? defMin.value;
  defMax.value = day.deficit?.max ?? defMax.value;

  renderMeals();
  const totals = calculateTotals(day);
  totalCaloriesEl.textContent = totals.calories;
  totalProteinEl.textContent = totals.protein;
  totalCarbsEl.textContent = totals.carbs;
  totalFatsEl.textContent = totals.fats;
  updateCalorieStatus(day, totals);
  updateWaterUI(day);
  renderCalendar();
  renderHistory();
  updateNoFapUI();
  updateDateLabel();
}

todayBtn.addEventListener('click', ()=>{
  selectedDateKey = getDateKey();
  datePicker.value = selectedDateKey;
  updateAll();
});
prevDayBtn.addEventListener('click', ()=>{
  const d = new Date(selectedDateKey);
  d.setDate(d.getDate() - 1);
  selectedDateKey = getDateKey(d);
  datePicker.value = selectedDateKey;
  updateAll();
});
nextDayBtn.addEventListener('click', ()=>{
  const d = new Date(selectedDateKey);
  d.setDate(d.getDate() + 1);
  selectedDateKey = getDateKey(d);
  datePicker.value = selectedDateKey;
  updateAll();
});

datePicker.addEventListener('change', (e)=>{
  selectedDateKey = e.target.value;
  updateAll();
});

maintenanceInput.addEventListener('change', ()=>{
  const day = getDay(selectedDateKey);
  day.maintenance = Number(maintenanceInput.value) || null;
  saveDay(selectedDateKey, day);
  updateAll();
});

applyDeficitBtn.addEventListener('click', ()=>{
  const min = Number(defMin.value) || 10;
  const max = Number(defMax.value) || 15;
  propagateDeficitFrom(selectedDateKey, min, max);
  updateAll();
});

add250.addEventListener('click', ()=>{
  const day = getDay(selectedDateKey);
  day.water.consumedMl = (day.water.consumedMl || 0) + 250;
  saveDay(selectedDateKey, day);
  updateAll();
});
sub250.addEventListener('click', ()=>{
  const day = getDay(selectedDateKey);
  day.water.consumedMl = Math.max(0, (day.water.consumedMl || 0) - 250);
  saveDay(selectedDateKey, day);
  updateAll();
});
setWaterGoal.addEventListener('click', ()=>{
  const val = Number(waterCustom.value);
  if(!val || val <= 0) return alert('Enter a positive goal in ml');
  const day = getDay(selectedDateKey);
  day.water.goalMl = val;
  saveDay(selectedDateKey, day);
  waterCustom.value = '';
  updateAll();
});

saveWeight.addEventListener('click', ()=>{
  const val = Number(weightInput.value);
  if(!val) return alert('Enter a valid weight');
  const day = getDay(selectedDateKey);
  day.weightKg = val;
  saveDay(selectedDateKey, day);
  weightSaved.textContent = 'Saved';
  setTimeout(()=> weightSaved.textContent = '', 1200);
  weightInput.value = '';
  updateAll();
});
saveSteps.addEventListener('click', ()=>{
  const val = Number(stepsInput.value);
  if(isNaN(val)) return alert('Enter valid steps');
  const day = getDay(selectedDateKey);
  day.steps = val;
  saveDay(selectedDateKey, day);
  stepsSaved.textContent = 'Saved';
  setTimeout(()=> stepsSaved.textContent = '', 1200);
  stepsInput.value = '';
  updateAll();
});

nofapToggle.addEventListener('click', ()=>{
  const day = getDay(selectedDateKey);
  day.nofap = !day.nofap;
  saveDay(selectedDateKey, day);
  updateAll();
});

nofapReset.addEventListener('click', ()=>{
  if(!confirm('Reset NoFap streak and clear all daily marks?')) return;
  const store = readStore();
  for(const k of Object.keys(store)){
    if(store[k].nofap) store[k].nofap = false;
  }
  writeStore(store);
  updateAll();
});

exportBtn.addEventListener('click', ()=>{
  const data = readStore();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'fitness-data.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener('click', ()=> importFile.click());
importFile.addEventListener('change', (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result);
      writeStore(parsed);
      updateAll();
      alert('Imported successfully');
    }catch(err){
      alert('Invalid JSON file');
    }
  };
  reader.readAsText(f);
});

clearBtn.addEventListener('click', ()=>{
  if(confirm('Clear all stored data? This cannot be undone.')) {
    localStorage.removeItem(STORAGE_KEY);
    updateAll();
  }
});

createMealCards();
updateAll();

document.addEventListener('keydown', (e)=>{
  if(e.key === 't' && (e.ctrlKey || e.metaKey)){
    e.preventDefault();
    selectedDateKey = getDateKey();
    datePicker.value = selectedDateKey;
    updateAll();
  }
});