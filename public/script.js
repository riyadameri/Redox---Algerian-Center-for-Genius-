// Global variables
let currentUser = null;
let currentPayment = null;
let currentClassId = null;
let currentStudentId = null;
let scheduleCounter = 1;
const socket = io(window.location.origin); // Connects to current host

// Authentication functions
async function login(username, password) {
try {
const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
});

const data = await response.json();

if (response.ok) {
    // Save token and user data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Set current user
    currentUser = data.user;
    
    // Update UI
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    document.getElementById('user-name').textContent = currentUser.fullName || currentUser.username;
    document.getElementById('user-role').textContent = getRoleName(currentUser.role);
    
    // Initialize the app
    initApp();
} else {
    Swal.fire('خطأ', data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
}
} catch (err) {
console.error('Login error:', err);
Swal.fire('خطأ', 'حدث خطأ أثناء محاولة تسجيل الدخول', 'error');
}
}

async function register(userData) {
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            Swal.fire('نجاح', 'تم إنشاء الحساب بنجاح', 'success');
            showLoginForm();
        } else {
            Swal.fire('خطأ', data.error || 'حدث خطأ أثناء إنشاء الحساب', 'error');
        }
    } catch (err) {
        console.error('Registration error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء محاولة إنشاء الحساب', 'error');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('loginForm').reset();
}

function getRoleName(role) {
    const roles = {
        'admin': 'مدير النظام',
        'secretary': 'سكرتير',
        'accountant': 'محاسب',
        'teacher': 'أستاذ'
    };
    return roles[role] || role;
}

function showLoginForm() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('register-section').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'block';
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Check authentication on page load
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (token && user) {
        currentUser = user;
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        document.getElementById('user-name').textContent = currentUser.fullName || currentUser.username;
        document.getElementById('user-role').textContent = getRoleName(currentUser.role);
        initApp();
    } else {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('main-app').style.display = 'none';
    }
}

// Initialize the application
function initApp() {
    // Load initial data

    document.getElementById('cardSearchInput').addEventListener('input', searchCards);

    loadStudents();
    loadTeachers();
    loadClasses();
    loadClassrooms();
    loadStudentsForPayments();
    loadClassesForPayments();
    loadMonthsForPayments();
    loadStudentsForCards();
    loadCards();
    loadClassroomsForClassModal();
    loadTeachersForClassModal();

    loadLiveClasses();
    loadDataForLiveClassModal();

    document.getElementById('accountStatusFilter').addEventListener('change', loadStudentAccounts);
    document.getElementById('accountSearchInput').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            loadStudentAccounts();
        }
    });
    
    loadStudentAccounts();
    
//serarsh 
    document.getElementById('studentSearchInput').addEventListener('input', searchStudents);
    document.getElementById('paymentSearchInput').addEventListener('input', searchPayments);

    // Set today's date as default registration date
    document.getElementById('registrationDate').value = new Date().toISOString().split('T')[0];
    
    // Initialize modals
    const modalElements = document.querySelectorAll('.modal');
    modalElements.forEach(modalEl => {
        new bootstrap.Modal(modalEl);
    });
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    // Initialize live class modal
    const liveClassModal = new bootstrap.Modal(document.getElementById('addLiveClassModal'));
    document.getElementById('live-classes-link').addEventListener('click', function() {
    loadDataForLiveClassModal();
    });


}

// Navigation between sections
document.querySelectorAll('[data-section]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active from all links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
              e.preventDefault();
              const sectionId = this.getAttribute('data-section');
              
              // Remove active class from all links and sections
              document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
              document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
              
              // Add active class to clicked link and corresponding section
              this.classList.add('active');
              document.getElementById(sectionId).classList.add('active');
              
              // Load data for the section
              loadSectionData(sectionId);
            });
          });
        
        // Activate current link
        this.classList.add('active');
        
        // Show requested section
        const sectionId = this.getAttribute('data-section');
        document.getElementById(sectionId).classList.add('active');
        
        // Load data when needed
        if (sectionId === 'students') loadStudents();
        else if (sectionId === 'teachers') loadTeachers();
        else if (sectionId === 'classes') loadClasses();
        else if (sectionId === 'classrooms') loadClassrooms();
        else if (sectionId === 'payments') {
            loadStudentsForPayments();
            loadPayments();
        }
        else if (sectionId === 'cards') {
            loadStudentsForCards();
            loadCards();
        }
    });
});

// Event listeners
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    // Simulate login
    Swal.fire({
      title: 'تسجيل الدخول',
      text: 'جاري التحقق من بيانات الدخول...',
      icon: 'info',
      showConfirmButton: false,
      timer: 1500
    }).then(() => {
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('main-app').style.display = 'block';
      // Set user info
      document.getElementById('user-name').textContent = 'المستخدم';
      document.getElementById('user-role').textContent = 'مدير النظام';
    });
  });
  
  document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    Swal.fire({
      title: 'تم التسجيل بنجاح',
      text: 'تم إنشاء حسابك بنجاح، يمكنك الآن تسجيل الدخول',
      icon: 'success'
    }).then(() => {
      document.getElementById('register-section').style.display = 'none';
      document.getElementById('login-section').style.display = 'block';
    });
  });
  
  

document.getElementById('current-year').textContent = new Date().getFullYear();


document.getElementById('show-register').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'block';
  });
  document.getElementById('show-login').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
  });
  

  document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    Swal.fire({
      title: 'تسجيل الخروج',
      text: 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم',
      cancelButtonText: 'إلغاء'
    }).then((result) => {
      if (result.isConfirmed) {
        document.getElementById('main-app').style.display = 'none';
        document.getElementById('login-section').style.display = 'block';
      }
    });
  });
  

// Data loading functions (students, teachers, classes, etc.)
async function loadStudents() {
    try {
        const response = await fetch('/api/students', {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const students = await response.json();
        
        const tableBody = document.getElementById('studentsTable');
        tableBody.innerHTML = '';
        
        students.forEach((student, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${student.name}</td>
                <td>${student.studentId}</td>
                <td>${student.parentName || '-'}</td>
                <td>${getAcademicYearName(student.academicYear) || '-'}</td>
                <td>${student.classes?.length || 0}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action" onclick="editStudent('${student._id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteStudent('${student._id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success btn-action" onclick="showEnrollModal('${student._id}')">
                        <i class="bi bi-book"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        document.getElementById('studentsCount').textContent = students.length;
    } catch (err) {
        console.error('Error loading students:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل بيانات الطلاب', 'error');
    }
}

async function loadTeachers() {
    try {
        const response = await fetch('/api/teachers', {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const teachers = await response.json();
        
        const tableBody = document.getElementById('teachersTable');
        tableBody.innerHTML = '';
        
        teachers.forEach((teacher, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${teacher.name}</td>
                <td>${teacher.subjects?.join('، ') || '-'}</td>
                <td>${teacher.phone || '-'}</td>
                <td>${new Date(teacher.hireDate).toLocaleDateString('ar-EG')}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action" onclick="editTeacher('${teacher._id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteTeacher('${teacher._id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        document.getElementById('teachersCount').textContent = teachers.length;
    } catch (err) {
        console.error('Error loading teachers:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل بيانات الأساتذة', 'error');
    }
}
async function loadClasses() {
    try {
        const response = await fetch('/api/classes', {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const classes = await response.json();
        console.log(classes); // تحقق من وجود academicYear في البيانات

        const tableBody = document.getElementById('classesTable');
        tableBody.innerHTML = '';
        
        classes.forEach((cls, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${cls.name}</td>
                <td>${cls.subject || '-'}</td>
                <td>${getAcademicYearName(cls.academicYear) || 'غير محدد'}</td>
                <td>${cls.teacher?.name || 'غير معين'}</td>
                <td>${cls.students?.length || 0}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action" onclick="editClass('${cls._id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteClass('${cls._id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success btn-action" onclick="showClassStudents('${cls._id}')">
                        <i class="bi bi-people"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        document.getElementById('classesCount').textContent = classes.length;
    } catch (err) {
        console.error('Error loading classes:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل بيانات الحصص', 'error');
    }
}

async function loadClassrooms() {
    try {
        const response = await fetch('/api/classrooms', {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const classrooms = await response.json();
        
        const tableBody = document.getElementById('classroomsTable');
        tableBody.innerHTML = '';
        
        classrooms.forEach((classroom, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${classroom.name}</td>
                <td>${classroom.capacity || '-'}</td>
                <td>${classroom.location || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action" onclick="editClassroom('${classroom._id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteClassroom('${classroom._id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (err) {
        console.error('Error loading classrooms:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل بيانات القاعات', 'error');
    }
}

async function loadStudentsForPayments() {
    try {
        const response = await fetch('/api/students', {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const students = await response.json();
        
        const select = document.getElementById('paymentStudentSelect');
        select.innerHTML = '<option value="" selected disabled>اختر طالب</option>';
        
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student._id;
            option.textContent = `${student.name} (${student.studentId})`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading students for payments:', err);
    }
}

async function loadClassesForPayments() {
    try {
        const response = await fetch('/api/classes', {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const classes = await response.json();
        
        const select = document.getElementById('paymentClassSelect');
        select.innerHTML = '<option value="" selected disabled>اختر حصة</option>';
        
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls._id;
            option.textContent = `${cls.name} (${cls.subject}) - ${getAcademicYearName(cls.academicYear)} - ${cls.price} د.ك`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading classes for payments:', err);
    }
}

async function loadMonthsForPayments() {
    const select = document.getElementById('paymentMonthSelect');
    select.innerHTML = '<option value="" selected disabled>اختر شهر</option>';
    
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
        
        const option = document.createElement('option');
        option.value = monthStr;
        option.textContent = monthName;
        select.appendChild(option);
    }
}

async function loadPayments(studentId = null, classId = null, month = null) {
    try {
        let url = '/api/payments';
        const params = [];
        
        if (studentId) params.push(`student=${studentId}`);
        if (classId) params.push(`class=${classId}`);
        if (month) params.push(`month=${month}`);
        
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }
        
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const payments = await response.json();
        
        const tableBody = document.getElementById('paymentsTable');
        tableBody.innerHTML = '';
        
        payments.forEach((payment, index) => {
            const row = document.createElement('tr');
            row.classList.add(`payment-${payment.status}`);
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${payment.student.name} (${payment.student.studentId})</td>
                <td>${payment.class.name}</td>
                <td>${payment.month}</td>
                <td>${payment.amount} د.ك</td>
                <td>
                    <span class="badge ${payment.status === 'paid' ? 'bg-success' : 
                                    payment.status === 'pending' ? 'bg-warning' : 'bg-danger'}">
                        ${payment.status === 'paid' ? 'مسدد' : 
                        payment.status === 'pending' ? 'قيد الانتظار' : 'متأخر'}
                    </span>
                </td>
                <td>${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('ar-EG') : '-'}</td>
                <td>
                    <button class="btn btn-sm ${payment.status !== 'paid' ? 'btn-success' : 'btn-secondary'} btn-action" 
                        onclick="showPaymentModal('${payment._id}')" 
                        ${payment.status === 'paid' ? 'disabled' : ''}>
                        <i class="bi bi-cash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (err) {
        console.error('Error loading payments:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل بيانات المدفوعات', 'error');
    }
}

async function loadStudentsForCards() {
    try {
        const response = await fetch('/api/students', {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const students = await response.json();
        
        const select = document.getElementById('cardStudentSelect');
        select.innerHTML = '<option value="" selected disabled>اختر طالب</option>';
// Inside loadStudents() or similar:
students.forEach((student, index) => {
const row = document.createElement('tr');
row.innerHTML = `
<td>${index + 1}</td>
<td>${student.name}</td>
<td>${student.studentId}</td>
<td>${student.parentName || '-'}</td>
<td>${getAcademicYearName(student.academicYear) || '-'}</td> <!-- Fix Here -->
<td>${student.classes?.length || 0}</td>
<td>
<!-- Actions -->
</td>
`;
tableBody.appendChild(row);
});
console.log("Student Academic Year:", student.academicYear); // Should log "3AP"
    } catch (err) {
        console.error('Error loading students for cards:', err);
    }
}

async function loadCards() {
    await searchCards();

    try {
        const response = await fetch('/api/cards', {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const cards = await response.json();
        
        const tableBody = document.getElementById('cardsTable');
        tableBody.innerHTML = '';
        
        cards.forEach((card, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${card.uid}</td>
                <td>${card.student.name} (${card.student.studentId})</td>
                <td>${new Date(card.issueDate).toLocaleDateString('ar-EG')}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteCard('${card._id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (err) {
        console.error('Error loading cards:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل بيانات البطاقات', 'error');
    }
}

async function loadClassroomsForClassModal() {
    try {
        const response = await fetch('/api/classrooms', {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const classrooms = await response.json();
        
        const selects = document.querySelectorAll('select[id^="classClassroom"]');
        selects.forEach(select => {
            select.innerHTML = '<option value="" selected disabled>اختر قاعة</option>';
            
            classrooms.forEach(classroom => {
                const option = document.createElement('option');
                option.value = classroom._id;
                option.textContent = `${classroom.name} (${classroom.location || 'غير محدد'})`;
                select.appendChild(option);
            });
        });
    } catch (err) {
        console.error('Error loading classrooms for class modal:', err);
    }
}

async function loadTeachersForClassModal() {
    try {
        const response = await fetch('/api/teachers', {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const teachers = await response.json();
        
        const teacherSelect = document.getElementById('classTeacherSelect');
        teacherSelect.innerHTML = '<option value="" selected disabled>اختر أستاذ</option>';
        
        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher._id;
            option.textContent = `${teacher.name} (${teacher.subjects?.join('، ') || 'بدون تخصص'})`;
            teacherSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading teachers for class modal:', err);
    }
}

// Helper functions
function getAcademicYearName(code) {
    if (!code || code === 'NS' || code === 'غير محدد') return 'غير محدد';
    
    const years = {
        // Secondary (AS)
        '1AS': 'الأولى ثانوي',
        '2AS': 'الثانية ثانوي',
        '3AS': 'الثالثة ثانوي',
        // Middle (MS)
        '1MS': 'الأولى متوسط',
        '2MS': 'الثانية متوسط',
        '3MS': 'الثالثة متوسط',
        '4MS': 'الرابعة متوسط',
        // Primary (AP)
        '1AP': 'الأولى ابتدائي',
        '2AP': 'الثانية ابتدائي',
        '3AP': 'الثالثة ابتدائي',
        '4AP': 'الرابعة ابتدائي',
        '5AP': 'الخامسة ابتدائي',
        // Other possible values
        'اولى ابتدائي': 'الأولى ابتدائي',
        'ثانية ابتدائي': 'الثانية ابتدائي',
        'ثالثة ابتدائي': 'الثالثة ابتدائي',
        'رابعة ابتدائي': 'الرابعة ابتدائي',
        'خامسة ابتدائي': 'الخامسة ابتدائي'
    };
    
    return years[code] || code; // Fallback to original code if not found
}
// Form submission handlers
document.getElementById('saveStudentBtn').addEventListener('click', async () => {
    const studentData = {
        name: document.getElementById('studentName').value,
        studentId: document.getElementById('studentId').value,
        birthDate: document.getElementById('birthDate').value,
        parentName: document.getElementById('parentName').value,
        parentPhone: document.getElementById('parentPhone').value,
        academicYear: document.getElementById('academicYear').value,
        registrationDate: document.getElementById('registrationDate').value || new Date(),
        active: 'true',
        status: 'active'
    };

    try {
        const response = await fetch('/api/students', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(studentData),
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (response.ok) {
            const newStudent = await response.json();
            
            // Close the modal first
            bootstrap.Modal.getInstance(document.getElementById('addStudentModal')).hide();
            
            // Show success message
            await Swal.fire({
                title: 'نجاح',
                text: 'تم إضافة الطالب بنجاح',
                icon: 'success',
                timer: 1000,
                showConfirmButton: false
            });

            // Print receipt automatically
            await printRegistrationReceipt(newStudent, 600);

            // Refresh data
            loadStudents();
            loadStudentsForPayments();
            loadStudentsForCards();
            
        } else {
            const error = await response.json();
            Swal.fire('خطأ', error.error || 'حدث خطأ أثناء إضافة الطالب', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء الاتصال بالخادم', 'error');
    }
});
document.getElementById('saveTeacherBtn').addEventListener('click', async () => {
    const teacherData = {
        name: document.getElementById('teacherName').value,
        subjects: Array.from(document.getElementById('teacherSubjects').selectedOptions).map(opt => opt.value),
        phone: document.getElementById('teacherPhone').value,
        email: document.getElementById('teacherEmail').value
    };
    
    try {
        const response = await fetch('/api/teachers', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(teacherData)
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (response.ok) {
            Swal.fire('نجاح', 'تم إضافة الأستاذ بنجاح', 'success');
            document.getElementById('addTeacherForm').reset();
            bootstrap.Modal.getInstance(document.getElementById('addTeacherModal')).hide();
            loadTeachers();
        } else {
            const error = await response.json();
            Swal.fire('خطأ', error.error || 'حدث خطأ أثناء إضافة الأستاذ', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء الاتصال بالخادم', 'error');
    }
});

document.getElementById('saveClassroomBtn').addEventListener('click', async () => {
    const classroomData = {
        name: document.getElementById('classroomName').value,
        capacity: document.getElementById('classroomCapacity').value,
        location: document.getElementById('classroomLocation').value
    };
    
    try {
        const response = await fetch('/api/classrooms', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(classroomData)
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (response.ok) {
            Swal.fire('نجاح', 'تم إضافة القاعة بنجاح', 'success');
            document.getElementById('addClassroomForm').reset();
            bootstrap.Modal.getInstance(document.getElementById('addClassroomModal')).hide();
            loadClassrooms();
        } else {
            const error = await response.json();
            Swal.fire('خطأ', error.error || 'حدث خطأ أثناء إضافة القاعة', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء الاتصال بالخادم', 'error');
    }
});

document.getElementById('saveClassBtn').addEventListener('click', async () => {
    // Collect schedule data
    const schedules = [];
    const scheduleItems = document.querySelectorAll('.schedule-item');
    
    scheduleItems.forEach(item => {
        const day = item.querySelector('select').value;
        const time = item.querySelector('input[type="time"]').value;
        const classroom = item.querySelectorAll('select')[1].value;
        
        if (day && time && classroom) {
            schedules.push({
                day,
                time,
                classroom
            });
        }
    });
    
    if (schedules.length === 0) {
        Swal.fire('خطأ', 'يجب إضافة جدول حصص واحد على الأقل', 'error');
        return;
    }
    
    const classData = {
        name: document.getElementById('className').value,
        subject: document.getElementById('classSubject').value,
        academicYear: document.getElementById('classAcademicYear').value,
        description: document.getElementById('classDescription').value,
        schedule: schedules,
        price: document.getElementById('classPrice').value,
        teacher: document.getElementById('classTeacherSelect').value
    };
    
    try {
        console.log('Academic Year:', document.getElementById('classAcademicYear').value);
        
        const response = await fetch('/api/classes', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(classData)
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (response.ok) {
            Swal.fire('نجاح', 'تم إضافة الحصة بنجاح', 'success');
            document.getElementById('addClassForm').reset();
            bootstrap.Modal.getInstance(document.getElementById('addClassModal')).hide();
            loadClasses();
            loadClassesForPayments();
        } else {
            const error = await response.json();
            Swal.fire('خطأ', error.error || 'حدث خطأ أثناء إضافة الحصة', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء الاتصال بالخادم', 'error');
    }
});

document.getElementById('addScheduleBtn').addEventListener('click', async () => {
    scheduleCounter++;
    const schedulesContainer = document.getElementById('classSchedules');
    
    const scheduleItem = document.createElement('div');
    scheduleItem.className = 'schedule-item';
    scheduleItem.innerHTML = `
        <div class="schedule-item-header">
            <h6>الحصة ${scheduleCounter}</h6>
            <button type="button" class="btn btn-sm btn-danger" onclick="removeSchedule(this)">
                <i class="bi bi-trash"></i>
            </button>
        </div>
        <div class="row">
            <div class="col-md-4 mb-3">
                <label for="classDay${scheduleCounter}" class="form-label">اليوم</label>
                <select class="form-select" id="classDay${scheduleCounter}">
                    <option value="السبت">السبت</option>
                    <option value="الأحد">الأحد</option>
                    <option value="الإثنين">الإثنين</option>
                    <option value="الثلاثاء">الثلاثاء</option>
                    <option value="الأربعاء">الأربعاء</option>
                    <option value="الخميس">الخميس</option>
                    <option value="الجمعة">الجمعة</option>
                </select>
            </div>
            <div class="col-md-4 mb-3">
                <label for="classTime${scheduleCounter}" class="form-label">الوقت</label>
                <input type="time" class="form-control" id="classTime${scheduleCounter}">
            </div>
            <div class="col-md-4 mb-3">
                <label for="classClassroom${scheduleCounter}" class="form-label">القاعة</label>
                <select class="form-select" id="classClassroom${scheduleCounter}"></select>
            </div>
        </div>
    `;
    
    schedulesContainer.appendChild(scheduleItem);
    
    // Load classrooms for the new select
    await loadClassroomsForClassModal();
});

document.getElementById('assignCardBtn').addEventListener('click', async () => {
    const studentId = document.getElementById('cardStudentSelect').value;
    const cardUid = document.getElementById('cardUid').value;
    
    if (!studentId || !cardUid) {
        Swal.fire('خطأ', 'يجب اختيار طالب ومسح البطاقة', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/cards', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                uid: cardUid,
                student: studentId
            })
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (response.ok) {
            Swal.fire('نجاح', 'تم تعيين البطاقة للطالب بنجاح', 'success');
            document.getElementById('cardUid').value = '';
            loadCards();
        } else {
            const error = await response.json();
            Swal.fire('خطأ', error.error || 'حدث خطأ أثناء تعيين البطاقة', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء الاتصال بالخادم', 'error');
    }
});

document.getElementById('savePaymentBtn').addEventListener('click', async () => {
    if (!currentPayment) return;
    
    const paymentData = {
        amount: document.getElementById('paymentAmount').value,
        paymentDate: document.getElementById('paymentDate').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        status: 'paid'
    };
    
    try {
        const response = await fetch(`/api/payments/${currentPayment._id}/pay`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(paymentData)
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (response.ok) {
            const result = await response.json();
            Swal.fire('نجاح', result.message, 'success');
            bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
            loadPayments();
        } else {
            const error = await response.json();
            Swal.fire('خطأ', error.error || 'حدث خطأ أثناء تسجيل الدفعة', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء الاتصال بالخادم', 'error');
    }
});

document.getElementById('enrollStudentBtn').addEventListener('click', async () => {
    const classId = document.getElementById('enrollClassSelect').value;
    const studentId = document.getElementById('enrollStudentSelect').value;
    
    if (!classId || !studentId) {
        Swal.fire('خطأ', 'يجب اختيار حصة وطالب', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/classes/${classId}/enroll/${studentId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (response.ok) {
            const result = await response.json();
            
            // Show generated payments
            const paymentsHtml = result.payments.map(payment => `
                <tr class="${payment.status === 'paid' ? 'table-success' : 
                            payment.status === 'pending' ? 'table-warning' : 'table-danger'}">
                    <td>${payment.month}</td>
                    <td>${payment.amount} د.ك</td>
                    <td>
                        <span class="badge ${payment.status === 'paid' ? 'bg-success' : 
                                        payment.status === 'pending' ? 'bg-warning' : 'bg-danger'}">
                            ${payment.status === 'paid' ? 'مسدد' : 
                            payment.status === 'pending' ? 'قيد الانتظار' : 'متأخر'}
                        </span>
                    </td>
                </tr>
            `).join('');
            
            Swal.fire({
                title: 'تمت العملية بنجاح',
                html: `
                    <p>${result.message}</p>
                    <h5 class="mt-3">الدفعات الشهرية:</h5>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>الشهر</th>
                                    <th>المبلغ</th>
                                    <th>الحالة</th>
                                </tr>
                            </thead>
                            <tbody>${paymentsHtml}</tbody>
                        </table>
                    </div>
                `,
                icon: 'success'
            });
            
            bootstrap.Modal.getInstance(document.getElementById('enrollStudentModal')).hide();
            loadClasses();
            loadStudents();
        } else {
            const error = await response.json();
            Swal.fire('خطأ', error.error || 'حدث خطأ أثناء إضافة الطالب للحصة', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء الاتصال بالخادم', 'error');
    }
});

// When student selection changes in payments section
document.getElementById('paymentStudentSelect').addEventListener('change', function() {
    loadPayments(this.value, 
                document.getElementById('paymentClassSelect').value,
                document.getElementById('paymentMonthSelect').value);
});

// When class selection changes in payments section
document.getElementById('paymentClassSelect').addEventListener('change', function() {
    loadPayments(document.getElementById('paymentStudentSelect').value,
                this.value,
                document.getElementById('paymentMonthSelect').value);
});

// When month selection changes in payments section
document.getElementById('paymentMonthSelect').addEventListener('change', function() {
    loadPayments(document.getElementById('paymentStudentSelect').value,
                document.getElementById('paymentClassSelect').value,
                this.value);
});

// Global functions
window.removeSchedule = function(button) {
    const scheduleItem = button.closest('.schedule-item');
    scheduleItem.remove();
    scheduleCounter--;
    
    // Renumber remaining schedule items
    const remainingItems = document.querySelectorAll('.schedule-item');
    remainingItems.forEach((item, index) => {
        item.querySelector('h6').textContent = `الحصة ${index + 1}`;
    });
};

window.showPaymentModal = async function(paymentId) {
    try {
        const response = await fetch(`/api/payments/${paymentId}`, {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const payment = await response.json();
        
        const { value: formValues } = await Swal.fire({
            title: 'تسديد الدفعة',
            html: `
                <div class="payment-modal-container">
                    <!-- Your payment form HTML here -->
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'تأكيد الدفع وطباعة الإيصال',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                return {
                    paymentDate: document.getElementById('payment-date').value,
                    paymentMethod: document.getElementById('payment-method').value
                };
            }
        });
        
        if (formValues) {
            // Set default payment date to today if not provided
            if (!formValues.paymentDate) {
                formValues.paymentDate = new Date().toISOString().split('T')[0];
            }
            
            const updateResponse = await fetch(`/api/payments/${paymentId}/pay`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify(formValues)
            });
            
            if (updateResponse.ok) {
                const updatedPayment = await updateResponse.json();
                
                // Print payment receipt automatically
                await printPaymentReceipt(updatedPayment);
                
                Swal.fire({
                    icon: 'success',
                    title: 'تم التسديد بنجاح',
                    text: 'تم تسجيل الدفعة وطباعة الإيصال',
                    confirmButtonText: 'حسناً'
                });
                
                // Refresh the students view
                if (payment.class?._id) {
                    showClassStudents(payment.class._id);
                }
            } else {
                throw new Error('فشل في تسجيل الدفعة');
            }
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ أثناء محاولة تسجيل الدفعة',
            confirmButtonText: 'حسناً'
        });
    }
};

async function printPaymentReceipt(payment) {
    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        const doc = iframe.contentWindow.document;
        
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>إيصال دفع</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        width: 80mm;
                        margin: 0 auto;
                        padding: 10px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 15px;
                    }
                    .receipt-info {
                        margin-bottom: 15px;
                    }
                    .receipt-info div {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 5px;
                    }
                    .footer {
                        margin-top: 20px;
                        text-align: center;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h3>إيصال دفع</h3>
                    <p>${new Date().toLocaleDateString('ar-EG')}</p>
                </div>
                
                <div class="receipt-info">
                    <div>
                        <span>اسم الطالب:</span>
                        <span>${payment.student?.name || 'غير معروف'}</span>
                    </div>
                    <div>
                        <span>الحصة:</span>
                        <span>${payment.class?.name || 'غير معروف'}</span>
                    </div>
                    <div>
                        <span>الشهر:</span>
                        <span>${payment.month}</span>
                    </div>
                    <div>
                        <span>المبلغ:</span>
                        <span>${payment.amount} د.ك</span>
                    </div>
                </div>
                
                <div class="footer">
                    <p>شكراً لكم</p>
                    <p>${new Date().toLocaleTimeString('ar-EG')}</p>
                </div>
                
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            setTimeout(function() {
                                window.close();
                            }, 500);
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        doc.close();
        
        iframe.contentWindow.onafterprint = function() {
            document.body.removeChild(iframe);
            resolve();
        };
    });
}

// Helper function to convert numbers to Arabic words
function convertNumberToArabicWords(number) {
    const arabicNumbers = {
        0: 'صفر',
        1: 'واحد',
        2: 'اثنان',
        3: 'ثلاثة',
        4: 'أربعة',
        5: 'خمسة',
        6: 'ستة',
        7: 'سبعة',
        8: 'ثمانية',
        9: 'تسعة',
        10: 'عشرة',
        20: 'عشرون',
        30: 'ثلاثون',
        40: 'أربعون',
        50: 'خمسون',
        60: 'ستون',
        70: 'سبعون',
        80: 'ثمانون',
        90: 'تسعون',
        100: 'مائة',
        200: 'مائتان',
        300: 'ثلاثمائة',
        400: 'أربعمائة',
        500: 'خمسمائة',
        600: 'ستمائة',
        700: 'سبعمائة',
        800: 'ثمانمائة',
        900: 'تسعمائة'
    };
    
    if (number === 600) return 'ستمائة';
    if (arabicNumbers[number]) return arabicNumbers[number];
    
    // Simple implementation for numbers up to 999
    if (number < 100) {
        const units = number % 10;
        const tens = Math.floor(number / 10) * 10;
        if (units === 0) return arabicNumbers[tens];
        return `${arabicNumbers[units]} و ${arabicNumbers[tens]}`;
    }
    
    const hundreds = Math.floor(number / 100) * 100;
    const remainder = number % 100;
    if (remainder === 0) return arabicNumbers[hundreds];
    return `${arabicNumbers[hundreds]} و ${convertNumberToArabicWords(remainder)}`;
}
window.showEnrollModal = async function(studentId) {
    try {
        // Load student data
        const studentResponse = await fetch(`/api/students/${studentId}`, {
            headers: getAuthHeaders()
                          });
        
        if (studentResponse.status === 401) {
            logout();
            return;
        }
        
        const student = await studentResponse.json();
        currentStudentId = student._id;
    

        // Load all classes
        const classesResponse = await fetch('/api/classes', {
            headers: getAuthHeaders()
          });
      
          const allClasses = await classesResponse.json();

        // Load classes the student is already enrolled in
        const enrolledClasses = student.classes || [];

        // Filter available classes
        const availableClasses = allClasses.filter(cls => {
            // Check if student is already enrolled
            const isEnrolled = enrolledClasses.some(enrolledClass => 
              enrolledClass._id === cls._id || enrolledClass === cls._id
            );
            
            if (isEnrolled) return false;
      
            // For classes with undefined/NS/غير محدد academic year, allow all students
            if (!cls.academicYear || cls.academicYear === 'NS' || cls.academicYear === 'غير محدد') {
              return true;
            }
      
            // Otherwise, only allow students with matching academic year
            return cls.academicYear === student.academicYear;
          });
      

        // Populate class select dropdown
        const select = document.getElementById('enrollClassSelect');
        select.innerHTML = '<option value="" selected disabled>اختر حصة</option>';
        
        if (availableClasses.length === 0) {
          select.innerHTML = '<option value="" disabled>لا توجد حصص متاحة</option>';
        } else {
          availableClasses.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls._id;
            option.textContent = `${cls.name} (${cls.subject}) - ${getAcademicYearName(cls.academicYear)}`;
            select.appendChild(option);
          });
        }
    
                
        // Set current student in the select
// Set current student in the select
document.getElementById('enrollStudentSelect').innerHTML = `
<option value="${student._id}" selected>${student.name} (${student.studentId})</option>
`;

        // Show the modal
        const enrollModal = new bootstrap.Modal(document.getElementById('enrollStudentModal'));
        enrollModal.show();
    

    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل بيانات الحصص', 'error');
    }
};

window.showAssignCardModal = function(uid) {
    document.getElementById('cardUid').value = uid;
    document.getElementById('cards-link').click();
    document.getElementById('cardStudentSelect').focus();
};

window.showClassStudents = async function(classId) {
    try {
      // Show loading animation
      Swal.fire({
        title: 'جاري التحميل...',
        html: '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>',
        allowOutsideClick: false,
        showConfirmButton: false
      });
  
      // Ensure classId is a string
      classId = typeof classId === 'object' ? classId._id : classId;
      
      // Fetch class data
      const classResponse = await fetch(`/api/classes/${classId}`, {
        headers: getAuthHeaders()
      });
      
      const classObj = await classResponse.json();
      
      // Fetch students data
      const students = await Promise.all(
        classObj.students.map(studentId => {
          const id = typeof studentId === 'object' ? studentId._id : studentId;
          return fetch(`/api/students/${id}`, {
            headers: getAuthHeaders()
          }).then(res => res.json())
        })
      );
      
      // Fetch payments data
      const paymentsResponse = await fetch(`/api/payments?class=${classId}`, {
        headers: getAuthHeaders()
      });
      
      const payments = await paymentsResponse.json();
  
      // Create HTML template with enhanced styling
      const studentsHtml = `
      <div class="student-management-container">
        <div class="class-header bg-primary text-white p-4 rounded mb-4">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h3 class="mb-1">${classObj.name}</h3>
              <p class="mb-0">${classObj.subject} - ${getAcademicYearName(classObj.academicYear)}</p>
              ${(!classObj.academicYear || classObj.academicYear === 'NS' || classObj.academicYear === 'غير محدد') ? 
                '<p class="mb-0"><small>هذه الحصة متاحة لجميع المستويات</small></p>' : ''}
            </div>
            <button class="btn btn-success" onclick="showEnrollStudentModal('${classId}')">
              <i class="bi bi-plus-lg me-1"></i> تسجيل طالب جديد
            </button>
          </div>
        </div>
        
        ${students.length > 0 ? students.map((student, index) => {
          const studentPayments = payments.filter(p => p.student && p.student._id === student._id);
          
          return `
          <div class="student-item card mb-4 shadow-sm" style="animation-delay: ${index * 0.1}s">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">${student.name} <small class="text-muted">(${student.studentId})</small></h5>
              <div>
                <button class="btn btn-sm btn-info me-2" onclick="printRegistrationReceipt(${JSON.stringify(student)}, 600)">
                  <i class="bi bi-printer me-1"></i> طباعة الإيصال
                </button>
                <button class="btn btn-sm btn-danger" onclick="unenrollStudent('${classId}', '${student._id}')">
                  <i class="bi bi-trash me-1"></i> إزالة من الحصة
                </button>
              </div>
            </div>
            <div class="card-body">
              <div class="student-info mb-3">
                <div class="d-flex align-items-center mb-2">
                  <i class="bi bi-person-badge me-2"></i>
                  <span>ولي الأمر: ${student.parentName || 'غير مسجل'}</span>
                </div>
                <div class="d-flex align-items-center">
                  <i class="bi bi-telephone me-2"></i>
                  <span>${student.parentPhone || 'غير مسجل'}</span>
                </div>
              </div>
              
              <h6 class="text-muted mb-3">حالة المدفوعات:</h6>
              
              ${studentPayments.length > 0 ? `
                <div class="table-responsive">
                  <table class="table table-striped table-hover">
                    <thead class="table-dark">
                      <tr>
                        <th>إجراء</th>
                        <th>الحالة</th>
                        <th>المبلغ</th>
                        <th>الشهر</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${studentPayments.map(payment => `
                        <tr>
                          <td>
                            <button class="btn btn-sm ${payment.status !== 'paid' ? 'btn-success' : 'btn-secondary'}" 
                              onclick="showPaymentModal('${payment._id}')" 
                              ${payment.status === 'paid' ? 'disabled' : ''}>
                              <i class="bi ${payment.status !== 'paid' ? 'bi-cash' : 'bi-check2'} me-1"></i>
                              ${payment.status !== 'paid' ? 'تسديد' : 'مسدد'}
                            </button>
                          </td>
                          <td>
                            <span class="badge ${payment.status === 'paid' ? 'bg-success' : 
                                            payment.status === 'pending' ? 'bg-warning' : 'bg-danger'}">
                              ${payment.status === 'paid' ? 'مسدد' : 
                              payment.status === 'pending' ? 'قيد الانتظار' : 'متأخر'}
                            </span>
                          </td>
                          <td>${payment.amount} د.ك</td>
                          <td>${payment.month}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : `
                <div class="empty-state text-center p-4 bg-light rounded">
                  <i class="bi bi-wallet2 text-muted" style="font-size: 2.5rem;"></i>
                  <p class="mt-2 mb-0">لا توجد مدفوعات مسجلة لهذا الطالب</p>
                </div>
              `}
            </div>
          </div>
          `;
        }).join('') : `
        <div class="empty-state text-center p-5 bg-light rounded">
          <i class="bi bi-people text-muted" style="font-size: 3rem;"></i>
          <h5 class="mt-3">لا يوجد طلاب مسجلين في هذه الحصة</h5>
          <p class="text-muted">يمكنك تسجيل طلاب جديدين باستخدام زر "تسجيل طالب جديد" بالأعلى</p>
        </div>
        `}
      </div>
      `;
      
      // Show the modal with all student data
      Swal.fire({
        title: `إدارة طلاب الحصة`,
        html: studentsHtml,
        width: '900px',
        showConfirmButton: false,
        showCloseButton: true,
        customClass: {
          popup: 'animate__animated animate__fadeInUp'
        },
        willOpen: () => {
          // Add animation to student items after they're rendered
          setTimeout(() => {
            const items = document.querySelectorAll('.student-item');
            items.forEach(item => {
              item.style.opacity = '1';
            });
          }, 100);
        }
      });
  
    } catch (err) {
      console.error('Error:', err);
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'حدث خطأ أثناء جلب بيانات الطلاب',
        confirmButtonText: 'حسناً',
        customClass: {
          popup: 'animate__animated animate__headShake'
        }
      });
    }
  };

// Helper function to show payment modal
window.showPaymentModal = async function(paymentId) {
try {
const paymentResponse = await fetch(`/api/payments/${paymentId}`, {
    headers: getAuthHeaders()
});

if (paymentResponse.status === 401) {
    logout();
    return;
}

const payment = await paymentResponse.json();

const { value: formValues } = await Swal.fire({
    title: 'تسديد الدفعة',
    html: `
<div class="payment-modal-container p-3">
<div class="mb-3">
<label class="form-label">الطالب:</label>
<input type="text" class="form-control" value="${payment.student.name}" readonly>
</div>
<div class="mb-3">
<label class="form-label">الحصة:</label>
<input type="text" class="form-control" value="${payment.class.name}" readonly>
</div>
<div class="mb-3">
<label class="form-label">الشهر:</label>
<input type="text" class="form-control" value="${payment.month}" readonly>
</div>
<div class="mb-3">
<label class="form-label">المبلغ:</label>
<input type="text" class="form-control" value="${payment.amount} د.ك" readonly>
</div>
<div class="mb-3">
<label class="form-label">تاريخ الدفع:</label>
<input type="date" id="payment-date" class="form-control" required>
</div>
<div class="mb-3">
<label class="form-label">طريقة الدفع:</label>
<select id="payment-method" class="form-select" required>
    <option value="cash">نقدي</option>
    <option value="bank">حوالة بنكية</option>
    <option value="online">دفع إلكتروني</option>
</select>
</div>
</div>
`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'تأكيد الدفع',
    cancelButtonText: 'إلغاء',
    preConfirm: () => {
        return {
            paymentDate: document.getElementById('payment-date').value,
            paymentMethod: document.getElementById('payment-method').value
        };
    }
});

if (formValues) {
    // Set default payment date to today if not provided
    if (!formValues.paymentDate) {
        formValues.paymentDate = new Date().toISOString().split('T')[0];
    }
    
    const response = await fetch(`/api/payments/${paymentId}/pay`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify(formValues)
    });
    
    if (response.ok) {
        Swal.fire({
            icon: 'success',
            title: 'تم التسديد بنجاح',
            text: 'تم تسجيل الدفعة بنجاح',
            confirmButtonText: 'حسناً'
        });
        
        // Refresh the students view
        showClassStudents(payment.class._id);
    } else {
        throw new Error('فشل في تسجيل الدفعة');
    }
}
} catch (err) {
console.error('Error:', err);
Swal.fire({
    icon: 'error',
    title: 'خطأ',
    text: 'حدث خطأ أثناء محاولة تسجيل الدفعة',
    confirmButtonText: 'حسناً'
});
}
};

// Helper function to show student enrollment modal
window.showEnrollStudentModal = async function(classId) {
try {
const response = await fetch(`/api/students`, {
    headers: getAuthHeaders()
});

if (response.status === 401) {
    logout();
    return;
}

const allStudents = await response.json();

// Get current class to filter students by academic year
const classResponse = await fetch(`/api/classes/${classId}`, {
    headers: getAuthHeaders()
});

if (classResponse.status === 401) {
    logout();
    return;
}

const classObj = await classResponse.json();

// Filter students - allow all students if class has no academic year
const availableStudents = allStudents.filter(student => {
    // If class has no academic year or it's "NS" or "غير محدد", allow all students
    if (!classObj.academicYear || 
        classObj.academicYear === 'NS' || 
        classObj.academicYear === 'غير محدد') {
        return !classObj.students.includes(student._id);
    }
    
    // Otherwise, only allow students with matching academic year
    return student.academicYear === classObj.academicYear && 
           !classObj.students.includes(student._id);
});

if (availableStudents.length === 0) {
    Swal.fire({
        icon: 'info',
        title: 'لا يوجد طلاب متاحين',
        text: 'لا يوجد طلاب غير مسجلين في هذه الحصة',
        confirmButtonText: 'حسناً'
    });
    return;

}

const { value: studentId } = await Swal.fire({
    title: 'تسجيل طالب جديد',
    input: 'select',
    inputOptions: availableStudents.reduce((options, student) => {
        options[student._id] = `${student.name} (${student.studentId})`;
        return options;
    }, {}),
    inputPlaceholder: 'اختر الطالب',
    showCancelButton: true,
    confirmButtonText: 'تسجيل',
    cancelButtonText: 'إلغاء',
    inputValidator: (value) => {
        if (!value) {
            return 'يجب اختيار طالب';
        }
    }
});

if (studentId) {
    // Enroll the student
    const enrollResponse = await fetch(`/api/classes/${classId}/enroll/${studentId}`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    
    if (enrollResponse.ok) {
        Swal.fire({
            icon: 'success',
            title: 'تم التسجيل بنجاح',
            text: 'تم تسجيل الطالب في الحصة بنجاح',
            confirmButtonText: 'حسناً'
        });
        
        // Refresh the students view
        showClassStudents(classId);
    } else {
        throw new Error('فشل في تسجيل الطالب');
    }
}
} catch (err) {
console.error('Error:', err);
Swal.fire({
    icon: 'error',
    title: 'خطأ',
    text: 'حدث خطأ أثناء محاولة تسجيل الطالب',
    confirmButtonText: 'حسناً'
});
}
};

// Helper function to unenroll student
window.unenrollStudent = async function(classId, studentId) {
try {
const result = await Swal.fire({
    title: 'هل أنت متأكد؟',
    text: "سيتم إزالة الطالب من هذه الحصة وجميع المدفوعات المرتبطة بها",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'نعم، إزالة',
    cancelButtonText: 'إلغاء'
});

if (result.isConfirmed) {
    const response = await fetch(`/api/classes/${classId}/unenroll/${studentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    
    if (response.ok) {
        Swal.fire({
            icon: 'success',
            title: 'تمت الإزالة',
            text: 'تم إزالة الطالب من الحصة بنجاح',
            confirmButtonText: 'حسناً'
        });
        
        // Refresh the students view
        showClassStudents(classId);
    } else {
        throw new Error('فشل في إزالة الطالب');
    }
}
} catch (err) {
console.error('Error:', err);
Swal.fire({
    icon: 'error',
    title: 'خطأ',
    text: 'حدث خطأ أثناء محاولة إزالة الطالب',
    confirmButtonText: 'حسناً'
});
}
};
window.unenrollStudent = async function(classId, studentId) {
    try {
        const { isConfirmed } = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'سيتم إزالة الطالب من الحصة وحذف مدفوعاته',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، إزالة',
            cancelButtonText: 'إلغاء'
        });
        
        if (isConfirmed) {
            const response = await fetch(`/api/classes/${classId}/unenroll/${studentId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (response.status === 401) {
                logout();
                return;
            }
            
            if (response.ok) {
                Swal.fire('نجاح', 'تم إزالة الطالب من الحصة بنجاح', 'success');
                showClassStudents(classId);
                loadClasses();
                loadStudents();
            } else {
                const error = await response.json();
                Swal.fire('خطأ', error.error, 'error');
            }
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء إزالة الطالب', 'error');
    }
};

window.editStudent = async function(studentId) {
    try {
        const response = await fetch(`/api/students/${studentId}`, {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const student = await response.json();
        
        // Fill the form with student data
        document.getElementById('studentName').value = student.name;
        document.getElementById('studentId').value = student.studentId;
        document.getElementById('birthDate').value = student.birthDate ? student.birthDate.split('T')[0] : '';
        document.getElementById('parentName').value = student.parentName || '';
        document.getElementById('parentPhone').value = student.parentPhone || '';
        document.getElementById('academicYear').value = student.academicYear || '';
        document.getElementById('registrationDate').value = student.registrationDate ? student.registrationDate.split('T')[0] : '';
        
        // Change the save button to update
        const saveBtn = document.getElementById('saveStudentBtn');
        saveBtn.innerHTML = '<i class="bi bi-save me-1"></i>تحديث الطالب';
        saveBtn.onclick = async function() {
            const studentData = {
                name: document.getElementById('studentName').value,
                studentId: document.getElementById('studentId').value,
                birthDate: document.getElementById('birthDate').value,
                parentName: document.getElementById('parentName').value,
                parentPhone: document.getElementById('parentPhone').value,
                academicYear: document.getElementById('academicYear').value,
                registrationDate: document.getElementById('registrationDate').value || new Date()
            };
            
            try {
                const updateResponse = await fetch(`/api/students/${studentId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(studentData)
                });
                
                if (updateResponse.status === 401) {
                    logout();
                    return;
                }
                
                if (updateResponse.ok) {
                    Swal.fire('نجاح', 'تم تحديث الطالب بنجاح', 'success');
                    bootstrap.Modal.getInstance(document.getElementById('addStudentModal')).hide();
                    loadStudents();
                    loadStudentsForPayments();
                    loadStudentsForCards();
                } else {
                    const error = await updateResponse.json();
                    Swal.fire('خطأ', error.error || 'حدث خطأ أثناء تحديث الطالب', 'error');
                }
            } catch (err) {
                console.error('Error:', err);
                Swal.fire('خطأ', 'حدث خطأ أثناء الاتصال بالخادم', 'error');
            }
        };
        
        // Show the modal
        const studentModal = new bootstrap.Modal(document.getElementById('addStudentModal'));
        studentModal.show();
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء جلب بيانات الطالب', 'error');
    }
};

window.deleteStudent = async function(studentId) {
    try {
        const { isConfirmed } = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'سيتم حذف الطالب وكل بياناته المرتبطة',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        });
        
        if (isConfirmed) {
            const response = await fetch(`/api/students/${studentId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (response.status === 401) {
                logout();
                return;
            }
            
            if (response.ok) {
                Swal.fire('نجاح', 'تم حذف الطالب بنجاح', 'success');
                loadStudents();
                loadStudentsForPayments();
                loadStudentsForCards();
            } else {
                const error = await response.json();
                Swal.fire('خطأ', error.error, 'error');
            }
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء حذف الطالب', 'error');
    }
};

window.editTeacher = async function(teacherId) {
    try {
        const response = await fetch(`/api/teachers/${teacherId}`, {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const teacher = await response.json();
        
        // Fill the form with teacher data
        document.getElementById('teacherName').value = teacher.name;
        
        // Select subjects
        const subjectSelect = document.getElementById('teacherSubjects');
        Array.from(subjectSelect.options).forEach(option => {
            option.selected = teacher.subjects?.includes(option.value) || false;
        });
        
        document.getElementById('teacherPhone').value = teacher.phone || '';
        document.getElementById('teacherEmail').value = teacher.email || '';
        
        // Change the save button to update
        const saveBtn = document.getElementById('saveTeacherBtn');
        saveBtn.innerHTML = '<i class="bi bi-save me-1"></i>تحديث الأستاذ';
        saveBtn.onclick = async function() {
            const teacherData = {
                name: document.getElementById('teacherName').value,
                subjects: Array.from(document.getElementById('teacherSubjects').selectedOptions).map(opt => opt.value),
                phone: document.getElementById('teacherPhone').value,
                email: document.getElementById('teacherEmail').value
            };
            
            try {
                const updateResponse = await fetch(`/api/teachers/${teacherId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(teacherData)
                });
                
                if (updateResponse.status === 401) {
                    logout();
                    return;
                }
                
                if (updateResponse.ok) {
                    Swal.fire('نجاح', 'تم تحديث الأستاذ بنجاح', 'success');
                    bootstrap.Modal.getInstance(document.getElementById('addTeacherModal')).hide();
                    loadTeachers();
                } else {
                    const error = await updateResponse.json();
                    Swal.fire('خطأ', error.error || 'حدث خطأ أثناء تحديث الأستاذ', 'error');
                }
            } catch (err) {
                console.error('Error:', err);
                Swal.fire('خطأ', 'حدث خطأ أثناء الاتصال بالخادم', 'error');
            }
        };
        
        // Show the modal
        const teacherModal = new bootstrap.Modal(document.getElementById('addTeacherModal'));
        teacherModal.show();
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء جلب بيانات الأستاذ', 'error');
    }
};

window.deleteTeacher = async function(teacherId) {
    try {
        const { isConfirmed } = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'سيتم حذف الأستاذ وكل بياناته المرتبطة',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        });
        
        if (isConfirmed) {
            const response = await fetch(`/api/teachers/${teacherId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (response.status === 401) {
                logout();
                return;
            }
            
            if (response.ok) {
                Swal.fire('نجاح', 'تم حذف الأستاذ بنجاح', 'success');
                loadTeachers();
            } else {
                const error = await response.json();
                Swal.fire('خطأ', error.error, 'error');
            }
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء حذف الأستاذ', 'error');
    }
};

window.editClass = async function(classId) {
    try {
        const response = await fetch(`/api/classes/${classId}`, {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const classObj = await response.json();
        
        // Fill the form with class data
        document.getElementById('className').value = classObj.name;
        document.getElementById('classSubject').value = classObj.subject || '';
        document.getElementById('classAcademicYear').value = classObj.academicYear || '';
        document.getElementById('classDescription').value = classObj.description || '';
        document.getElementById('classPrice').value = classObj.price;
        document.getElementById('classTeacherSelect').value = classObj.teacher?._id || '';
        
        // Clear existing schedules
        const schedulesContainer = document.getElementById('classSchedules');
        schedulesContainer.innerHTML = '';
        scheduleCounter = 0;
        
        // Add schedules
        if (classObj.schedule && classObj.schedule.length > 0) {
            classObj.schedule.forEach((schedule, index) => {
                scheduleCounter++;
                const scheduleItem = document.createElement('div');
                scheduleItem.className = 'schedule-item';
                scheduleItem.innerHTML = `
                    <div class="schedule-item-header">
                        <h6>الحصة ${scheduleCounter}</h6>
                        <button type="button" class="btn btn-sm btn-danger" onclick="removeSchedule(this)">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                    <div class="row">
                        <div class="col-md-4 mb-3">
                            <label for="classDay${scheduleCounter}" class="form-label">اليوم</label>
                            <select class="form-select" id="classDay${scheduleCounter}">
                                <option value="السبت" ${schedule.day === 'السبت' ? 'selected' : ''}>السبت</option>
                                <option value="الأحد" ${schedule.day === 'الأحد' ? 'selected' : ''}>الأحد</option>
                                <option value="الإثنين" ${schedule.day === 'الإثنين' ? 'selected' : ''}>الإثنين</option>
                                <option value="الثلاثاء" ${schedule.day === 'الثلاثاء' ? 'selected' : ''}>الثلاثاء</option>
                                <option value="الأربعاء" ${schedule.day === 'الأربعاء' ? 'selected' : ''}>الأربعاء</option>
                                <option value="الخميس" ${schedule.day === 'الخميس' ? 'selected' : ''}>الخميس</option>
                                <option value="الجمعة" ${schedule.day === 'الجمعة' ? 'selected' : ''}>الجمعة</option>
                            </select>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label for="classTime${scheduleCounter}" class="form-label">الوقت</label>
                            <input type="time" class="form-control" id="classTime${scheduleCounter}" value="${schedule.time}">
                        </div>
                        <div class="col-md-4 mb-3">
                            <label for="classClassroom${scheduleCounter}" class="form-label">القاعة</label>
                            <select class="form-select" id="classClassroom${scheduleCounter}"></select>
                        </div>
                    </div>
                `;
                schedulesContainer.appendChild(scheduleItem);
            });
            
            // Load classrooms for each schedule
            await loadClassroomsForClassModal();
            
            // Set the classroom values after the selects are populated
            classObj.schedule.forEach((schedule, index) => {
                const classroomSelect = document.getElementById(`classClassroom${index + 1}`);
                if (classroomSelect) {
                    classroomSelect.value = schedule.classroom;
                }
            });
        } else {
            // Add one empty schedule if none exist
            scheduleCounter++;
            const scheduleItem = document.createElement('div');
            scheduleItem.className = 'schedule-item';
            scheduleItem.innerHTML = `
                <div class="schedule-item-header">
                    <h6>الحصة 1</h6>
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeSchedule(this)">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label for="classDay1" class="form-label">اليوم</label>
                        <select class="form-select" id="classDay1">
                            <option value="السبت">السبت</option>
                            <option value="الأحد">الأحد</option>
                            <option value="الإثنين">الإثنين</option>
                            <option value="الثلاثاء">الثلاثاء</option>
                            <option value="الأربعاء">الأربعاء</option>
                            <option value="الخميس">الخميس</option>
                            <option value="الجمعة">الجمعة</option>
                        </select>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="classTime1" class="form-label">الوقت</label>
                        <input type="time" class="form-control" id="classTime1">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="classClassroom1" class="form-label">القاعة</label>
                        <select class="form-select" id="classClassroom1"></select>
                    </div>
                </div>
            `;
            schedulesContainer.appendChild(scheduleItem);
            
            // Load classrooms for the new schedule
            await loadClassroomsForClassModal();
        }
        
        // Change the save button to update
        const saveBtn = document.getElementById('saveClassBtn');
        saveBtn.innerHTML = '<i class="bi bi-save me-1"></i>تحديث الحصة';
        saveBtn.onclick = async function() {
            // Collect schedule data
            const schedules = [];
            const scheduleItems = document.querySelectorAll('.schedule-item');
            
            scheduleItems.forEach(item => {
                const day = item.querySelector('select').value;
                const time = item.querySelector('input[type="time"]').value;
                const classroom = item.querySelectorAll('select')[1].value;
                
                if (day && time && classroom) {
                    schedules.push({
                        day,
                        time,
                        classroom
                    });
                }
            });
            
            if (schedules.length === 0) {
                Swal.fire('خطأ', 'يجب إضافة جدول حصص واحد على الأقل', 'error');
                return;
            }
            
            const classData = {
                name: document.getElementById('className').value,
                subject: document.getElementById('classSubject').value,
                academicYear: document.getElementById('classAcademicYear').value,
                description: document.getElementById('classDescription').value,
                schedule: schedules,
                price: document.getElementById('classPrice').value,
                teacher: document.getElementById('classTeacherSelect').value
            };
            
            try {
                const updateResponse = await fetch(`/api/classes/${classId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(classData)
                });
                
                if (updateResponse.status === 401) {
                    logout();
                    return;
                }
                
                if (updateResponse.ok) {
                    Swal.fire('نجاح', 'تم تحديث الحصة بنجاح', 'success');
                    bootstrap.Modal.getInstance(document.getElementById('addClassModal')).hide();
                    loadClasses();
                    loadClassesForPayments();
                } else {
                    const error = await updateResponse.json();
                    Swal.fire('خطأ', error.error || 'حدث خطأ أثناء تحديث الحصة', 'error');
                }
            } catch (err) {
                console.error('Error:', err);
                Swal.fire('خطأ', 'حدث خطأ أثناء الاتصال بالخادم', 'error');
            }
        };
        
        // Show the modal
        const classModal = new bootstrap.Modal(document.getElementById('addClassModal'));
        classModal.show();
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء جلب بيانات الحصة', 'error');
    }
};

window.deleteClass = async function(classId) {
    try {
        const { isConfirmed } = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'سيتم حذف الحصة وكل البيانات المرتبطة بها',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        });
        
        if (isConfirmed) {
            const response = await fetch(`/api/classes/${classId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (response.status === 401) {
                logout();
                return;
            }
            
            if (response.ok) {
                Swal.fire('نجاح', 'تم حذف الحصة بنجاح', 'success');
                loadClasses();
                loadClassesForPayments();
            } else {
                const error = await response.json();
                Swal.fire('خطأ', error.error, 'error');
            }
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء حذف الحصة', 'error');
    }
};

window.editClassroom = async function(classroomId) {
    try {
        const response = await fetch(`/api/classrooms/${classroomId}`, {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const classroom = await response.json();
        
        // Fill the form with classroom data
        document.getElementById('classroomName').value = classroom.name;
        document.getElementById('classroomCapacity').value = classroom.capacity || '';
        document.getElementById('classroomLocation').value = classroom.location || '';
        
        // Change the save button to update
        const saveBtn = document.getElementById('saveClassroomBtn');
        saveBtn.innerHTML = '<i class="bi bi-save me-1"></i>تحديث القاعة';
        saveBtn.onclick = async function() {
            const classroomData = {
                name: document.getElementById('classroomName').value,
                capacity: document.getElementById('classroomCapacity').value,
                location: document.getElementById('classroomLocation').value
            };
            
            try {
                const updateResponse = await fetch(`/api/classrooms/${classroomId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(classroomData)
                });
                
                if (updateResponse.status === 401) {
                    logout();
                    return;
                }
                
                if (updateResponse.ok) {
                    Swal.fire('نجاح', 'تم تحديث القاعة بنجاح', 'success');
                    bootstrap.Modal.getInstance(document.getElementById('addClassroomModal')).hide();
                    loadClassrooms();
                } else {
                    const error = await updateResponse.json();
                    Swal.fire('خطأ', error.error || 'حدث خطأ أثناء تحديث القاعة', 'error');
                }
            } catch (err) {
                console.error('Error:', err);
                Swal.fire('خطأ', 'حدث خطأ أثناء الاتصال بالخادم', 'error');
            }
        };
        
        // Show the modal
        const classroomModal = new bootstrap.Modal(document.getElementById('addClassroomModal'));
        classroomModal.show();
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء جلب بيانات القاعة', 'error');
    }
};

window.deleteClassroom = async function(classroomId) {
    try {
        const { isConfirmed } = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'سيتم حذف القاعة وكل البيانات المرتبطة بها',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        });
        
        if (isConfirmed) {
            const response = await fetch(`/api/classrooms/${classroomId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (response.status === 401) {
                logout();
                return;
            }
            
            if (response.ok) {
                Swal.fire('نجاح', 'تم حذف القاعة بنجاح', 'success');
                loadClassrooms();
            } else {
                const error = await response.json();
                Swal.fire('خطأ', error.error, 'error');
            }
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء حذف القاعة', 'error');
    }
};

window.deleteCard = async function(cardId) {
    try {
        const { isConfirmed } = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'سيتم حذف البطاقة ولن يتم التعرف على الطالب عند مسحها',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        });
        
        if (isConfirmed) {
            const response = await fetch(`/api/cards/${cardId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (response.status === 401) {
                logout();
                return;
            }
            
            if (response.ok) {
                Swal.fire('نجاح', 'تم حذف البطاقة بنجاح', 'success');
                loadCards();
            } else {
                const error = await response.json();
                Swal.fire('خطأ', error.error, 'error');
            }
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء حذف البطاقة', 'error');
    }
};

// Handle RFID cards
socket.on('student-detected', async (data) => {
    try {
        const rfidResult = document.getElementById('rfid-result');
        const student = data.student;
        
        if (!student) {
            rfidResult.innerHTML = `
                <div class="alert alert-warning">
                    <h4>بطاقة غير معروفة</h4>
                    <p>UID: ${data.card?.uid || 'غير معروف'}</p>
                    <button class="btn btn-primary" onclick="showAssignCardModal('${data.card.uid}')">
                        تعيين البطاقة لطالب
                    </button>
                </div>
            `;
            return;
        }

        // Show student info
        rfidResult.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h4>${student.name}</h4>
                    <p>رقم الطالب: ${student.studentId}</p>
                    <!-- Add more student details -->
                </div>
            </div>
        `;

        // Handle attendance if class is ongoing
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const response = await fetch(`/api/live-classes?status=ongoing&date=${today.toISOString()}`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const liveClasses = await response.json();
            if (liveClasses.length > 0) {
                const { value: accept } = await Swal.fire({
                    title: 'تسجيل الحضور',
                    html: `تم الكشف عن الطالب <strong>${student.name}</strong>`,
                    showCancelButton: true,
                    confirmButtonText: 'تسجيل الحضور',
                    cancelButtonText: 'إلغاء'
                });
                
                if (accept) {
                    await handleRFIDAttendance(data.card.uid);
                }
            }
        }
    } catch (err) {
        console.error('Error handling student detection:', err);
    }
});




window.showManualAttendanceModalForStudent = async function(studentId) {
try {
// Find ongoing live classes
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const response = await fetch(`/api/live-classes?status=ongoing&date=${today.toISOString()}`, {
headers: getAuthHeaders()
});

if (response.status === 401) {
logout();
return;
}

const liveClasses = await response.json();

if (liveClasses.length === 0) {
Swal.fire({
icon: 'info',
title: 'لا توجد حصة جارية',
text: 'لا يوجد حصص جارية حالياً لتسجيل الحضور',
confirmButtonText: 'حسناً'
});
return;
}

// Create HTML for the modal
const html = `
<div class="manual-attendance-container border rounded p-4 shadow-sm bg-light">
<h5 class="mb-3 text-primary fw-bold">
<i class="bi bi-pencil-square me-2"></i> Manual Attendance Registration
</h5>

<ul class="list-unstyled mb-4">
<li><strong>Class:</strong> ${liveClasses[0].class.name}</li>
<li><strong>Date:</strong> ${new Date(liveClasses[0].date).toLocaleDateString('ar-EG')}</li>
<li><strong>Student:</strong> ${document.querySelector('#rfid-result h4').textContent}</li>
</ul>

<div class="mb-3">
<label for="attendanceStatus" class="form-label fw-semibold">Attendance Status:</label>
<select id="attendanceStatus" class="form-select">
<option value="present">Present</option>
<option value="late">Late</option>
<option value="absent">Absent</option>
</select>
</div>
</div>
`;

const { value: status } = await Swal.fire({
title: 'تسجيل الحضور يدوياً',
html: html,
focusConfirm: false,
showCancelButton: true,
confirmButtonText: 'تسجيل',
cancelButtonText: 'إلغاء',
preConfirm: () => {
return document.getElementById('attendanceStatus').value;
}
});

if (status) {
// Submit attendance
const attendanceResponse = await fetch(`/api/live-classes/${liveClasses[0]._id}/attendance`, {
method: 'POST',
headers: {
    'Content-Type': 'application/json',
    ...getAuthHeaders()
},
body: JSON.stringify({
    studentId: studentId,
    status: status,
    method: 'manual'
})
});

if (attendanceResponse.ok) {
Swal.fire({
    icon: 'success',
    title: 'تم التسجيل بنجاح',
    text: 'تم تسجيل حضور الطالب بنجاح',
    confirmButtonText: 'حسناً'
});
} else {
throw new Error('فشل في تسجيل الحضور');
}
}
} catch (err) {
console.error('Error:', err);
Swal.fire({
icon: 'error',
title: 'خطأ',
text: 'حدث خطأ أثناء محاولة تسجيل الحضور',
confirmButtonText: 'حسناً'
});
}
};



socket.on('unknown-card', (data) => {
    const rfidResult = document.getElementById('rfid-result');
    rfidResult.innerHTML = `
<div class="alert alert-warning text-center shadow-sm p-4 rounded">
<h4 class="mb-3 fw-bold text-danger">
<i class="bi bi-exclamation-triangle-fill me-2"></i> Unregistered Card
</h4>
<p class="mb-4 fs-5">Card UID: <span class="fw-semibold">${data.uid}</span></p>
<button class="btn btn-outline-primary px-4" onclick="showAssignCardModal('${data.uid}')">
<i class="bi bi-credit-card me-2"></i> Assign Card to Student
</button>
</div>

    `;
});

socket.on('card-error', (data) => {
    const rfidResult = document.getElementById('rfid-result');
    rfidResult.innerHTML = `
        <div class="alert alert-danger text-center">
            <h4>حدث خطأ</h4>
            <p>${data.error}</p>
        </div>
    `;
});

// Check authentication on page load
document.addEventListener('DOMContentLoaded', checkAuth);


// Live Classes Functions
async function loadLiveClasses(status = null, date = null) {
try {
let url = '/api/live-classes';
const params = [];

if (status) params.push(`status=${status}`);
if (date) params.push(`date=${date}`);

if (params.length > 0) {
url += `?${params.join('&')}`;
}

const response = await fetch(url, {
headers: getAuthHeaders()
});

if (response.status === 401) {
logout();
return;
}

const liveClasses = await response.json();

const tableBody = document.getElementById('liveClassesTable');
tableBody.innerHTML = '';

liveClasses.forEach((liveClass, index) => {
// Add null checks
const className = liveClass.class?.name || 'غير معين';
const teacherName = liveClass.teacher?.name || 'غير معين';

const row = document.createElement('tr');
row.innerHTML = `
<td>${index + 1}</td>
<td>${className}</td>
<td>${new Date(liveClass.date).toLocaleDateString('ar-EG')}</td>
<td>${liveClass.startTime} ${liveClass.endTime ? `- ${liveClass.endTime}` : ''}</td>
<td>${teacherName}</td>
<td>
<span class="badge ${getStatusBadgeClass(liveClass.status)}">
${getStatusText(liveClass.status)}
</span>
</td>
<td>
<div class="btn-group">
<button class="btn btn-sm btn-outline-primary" onclick="showLiveClassDetails('${liveClass._id}')">
<i class="bi bi-eye"></i>
</button>
${liveClass.status === 'scheduled' ? `
<button class="btn btn-sm btn-success" onclick="startLiveClass('${liveClass._id}')">
<i class="bi bi-play"></i> بدء
</button>
` : ''}
${liveClass.status === 'ongoing' ? `
<button class="btn btn-sm btn-warning" onclick="showManualAttendanceModal('${liveClass._id}')">
<i class="bi bi-person-plus"></i> حضور
</button>
<button class="btn btn-sm btn-danger" onclick="endLiveClass('${liveClass._id}')">
<i class="bi bi-stop"></i> إنهاء
</button>
` : ''}
</div>
</td>
`;
tableBody.appendChild(row);
});
} catch (err) {
console.error('Error loading live classes:', err);
Swal.fire('خطأ', 'حدث خطأ أثناء تحميل الحصص الحية', 'error');
}
}

function getStatusBadgeClass(status) {
switch (status) {
case 'scheduled': return 'bg-secondary';
case 'ongoing': return 'bg-primary';
case 'completed': return 'bg-success';
case 'cancelled': return 'bg-danger';
default: return 'bg-secondary';
}
}

function getStatusText(status) {
switch (status) {
case 'scheduled': return 'مجدولة';
case 'ongoing': return 'جارية';
case 'completed': return 'منتهية';
case 'cancelled': return 'ملغاة';
default: return status;
}
}

async function showLiveClassDetails(liveClassId) {
try {
const response = await fetch(`/api/live-classes/${liveClassId}`, {
headers: getAuthHeaders()
});

if (response.status === 401) {
logout();
return;
}

const liveClass = await response.json();

// Create HTML for the modal
const html = `
<div class="row">
<div class="col-md-6">
    <h5>معلومات الحصة</h5>
    <p><strong>الحصة:</strong> ${liveClass.class.name}</p>
    <p><strong>التاريخ:</strong> ${new Date(liveClass.date).toLocaleDateString('ar-EG')}</p>
    <p><strong>الوقت:</strong> ${liveClass.startTime} ${liveClass.endTime ? `- ${liveClass.endTime}` : ''}</p>
    <p><strong>الأستاذ:</strong> ${liveClass.teacher.name}</p>
    <p><strong>الحالة:</strong> <span class="badge ${getStatusBadgeClass(liveClass.status)}">${getStatusText(liveClass.status)}</span></p>
</div>
<div class="col-md-6">
    <h5>الحضور</h5>
    <div class="table-responsive">
    <table class="table table-sm">
        <thead>
        <tr>
            <th>الطالب</th>
            <th>الحضور</th>
        </tr>
        </thead>
        <tbody>
        ${liveClass.attendance.map(att => `
            <tr>
            <td>${att.student.name}</td>
            <td>
                <span class="badge ${att.status === 'present' ? 'bg-success' : att.status === 'late' ? 'bg-warning' : 'bg-danger'}">
                ${att.status === 'present' ? 'حاضر' : att.status === 'late' ? 'متأخر' : 'غائب'}
                </span>
            </td>
            </tr>
        `).join('')}
        </tbody>
    </table>
    </div>
</div>
</div>
`;

Swal.fire({
title: 'تفاصيل الحصة',
html: html,
width: '800px',
showConfirmButton: false,
showCloseButton: true
});
} catch (err) {
console.error('Error:', err);
Swal.fire('خطأ', 'حدث خطأ أثناء جلب تفاصيل الحصة', 'error');
}
}

async function startLiveClass(liveClassId) {
    try {
        const response = await fetch(`/api/live-classes/${liveClassId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: 'ongoing' })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to start class');
        }

        Swal.fire('نجاح', 'تم بدء الحصة بنجاح', 'success');
        loadLiveClasses();
    } catch (err) {
        console.error('Error starting live class:', err);
        Swal.fire('خطأ', err.message || 'حدث خطأ أثناء بدء الحصة', 'error');
    }
}

async function endLiveClass(liveClassId) {
    try {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0');

        const response = await fetch(`/api/live-classes/${liveClassId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                status: 'completed',
                endTime: currentTime
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to end class');
        }

        Swal.fire('نجاح', 'تم إنهاء الحصة بنجاح', 'success');
        loadLiveClasses();
    } catch (err) {
        console.error('Error ending live class:', err);
        Swal.fire('خطأ', err.message || 'حدث خطأ أثناء إنهاء الحصة', 'error');
    }
}

async function endLiveClass(liveClassId) {
try {
const now = new Date();
const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

const response = await fetch(`/api/live-classes/${liveClassId}`, {
method: 'PUT',
headers: getAuthHeaders(),
body: JSON.stringify({ 
status: 'completed',
endTime: currentTime
})
});

if (response.status === 401) {
logout();
return;
}

if (response.ok) {
Swal.fire('نجاح', 'تم إنهاء الحصة بنجاح', 'success');
loadLiveClasses();
} else {
const error = await response.json();
Swal.fire('خطأ', error.error, 'error');
}
} catch (err) {
console.error('Error:', err);
Swal.fire('خطأ', 'حدث خطأ أثناء إنهاء الحصة', 'error');
}
}

async function cancelLiveClass(liveClassId) {
try {
const { isConfirmed } = await Swal.fire({
title: 'هل أنت متأكد؟',
text: 'سيتم إلغاء هذه الحصة',
icon: 'warning',
showCancelButton: true,
confirmButtonText: 'نعم، ألغِ الحصة',
cancelButtonText: 'إلغاء'
});

if (isConfirmed) {
const response = await fetch(`/api/live-classes/${liveClassId}`, {
method: 'PUT',
headers: getAuthHeaders(),
body: JSON.stringify({ status: 'cancelled' })
});

if (response.status === 401) {
logout();
return;
}

if (response.ok) {
Swal.fire('نجاح', 'تم إلغاء الحصة بنجاح', 'success');
loadLiveClasses();
} else {
const error = await response.json();
Swal.fire('خطأ', error.error, 'error');
}
}
} catch (err) {
console.error('Error:', err);
Swal.fire('خطأ', 'حدث خطأ أثناء إلغاء الحصة', 'error');
}
}

async function showLiveClassReport(classId) {
try {
const { value: dates } = await Swal.fire({
title: 'تقرير الحضور',
html: `
<div class="row">
    <div class="col-md-6 mb-3">
    <label for="fromDate" class="form-label">من تاريخ</label>
    <input type="date" id="fromDate" class="form-control" required>
    </div>
    <div class="col-md-6 mb-3">
    <label for="toDate" class="form-label">إلى تاريخ</label>
    <input type="date" id="toDate" class="form-control" required>
    </div>
</div>
`,
focusConfirm: false,
showCancelButton: true,
confirmButtonText: 'عرض التقرير',
cancelButtonText: 'إلغاء',
preConfirm: () => {
return {
    fromDate: document.getElementById('fromDate').value,
    toDate: document.getElementById('toDate').value
};
}
});

if (dates) {
const response = await fetch(`/api/live-classes/${classId}/report?fromDate=${dates.fromDate}&toDate=${dates.toDate}`, {
headers: getAuthHeaders()
});

if (response.status === 401) {
logout();
return;
}

const report = await response.json();

// Create HTML for the report
const html = `
<div class="report-container">
    <h5>تقرير الحضور للحصة: ${report.class}</h5>
    <p>عدد الحصص في الفترة: ${report.totalClasses}</p>
    
    <div class="table-responsive mt-4">
    <table class="table table-striped">
        <thead>
        <tr>
            <th>الطالب</th>
            <th>حضور</th>
            <th>غياب</th>
            <th>تأخير</th>
            <th>النسبة</th>
        </tr>
        </thead>
        <tbody>
        ${Object.values(report.attendance).map(att => `
            <tr>
            <td>${att.student.name}</td>
            <td>${att.present}</td>
            <td>${att.absent}</td>
            <td>${att.late}</td>
            <td>
                ${report.totalClasses > 0 ? 
                Math.round((att.present / report.totalClasses) * 100) : 0}%
            </td>
            </tr>
        `).join('')}
        </tbody>
    </table>
    </div>
</div>
`;

Swal.fire({
title: 'تقرير الحضور',
html: html,
width: '900px',
showConfirmButton: false,
showCloseButton: true
});
}
} catch (err) {
console.error('Error:', err);
Swal.fire('خطأ', 'حدث خطأ أثناء جلب التقرير', 'error');
}
}
async function filterLiveClasses() {
const status = document.getElementById('liveClassStatusFilter').value;
const date = document.getElementById('liveClassDateFilter').value;

await loadLiveClasses(status, date);
}
async function loadDataForLiveClassModal() {
try {
// Load classes
const classesResponse = await fetch('/api/classes', {
headers: getAuthHeaders()
});
const classes = await classesResponse.json();

const classSelect = document.getElementById('liveClassClassSelect');
classSelect.innerHTML = '<option value="" selected disabled>اختر حصة</option>';
classes.forEach(cls => {
const option = document.createElement('option');
option.value = cls._id;
option.textContent = `${cls.name} (${cls.subject})`;
classSelect.appendChild(option);
});

// Load teachers
const teachersResponse = await fetch('/api/teachers', {
headers: getAuthHeaders()
});
const teachers = await teachersResponse.json();

const teacherSelect = document.getElementById('liveClassTeacherSelect');
teacherSelect.innerHTML = '<option value="" selected disabled>اختر أستاذ</option>';
teachers.forEach(teacher => {
const option = document.createElement('option');
option.value = teacher._id;
option.textContent = teacher.name;
teacherSelect.appendChild(option);
});

// Load classrooms
const classroomsResponse = await fetch('/api/classrooms', {
headers: getAuthHeaders()
});
const classrooms = await classroomsResponse.json();

const classroomSelect = document.getElementById('liveClassClassroomSelect');
classroomSelect.innerHTML = '<option value="" selected disabled>اختر قاعة</option>';
classrooms.forEach(classroom => {
const option = document.createElement('option');
option.value = classroom._id;
option.textContent = `${classroom.name} (${classroom.location || 'غير محدد'})`;
classroomSelect.appendChild(option);
});

// Set default date to today
document.getElementById('liveClassDate').value = new Date().toISOString().split('T')[0];

// Set default time to current time + 30 minutes
const now = new Date();
now.setMinutes(now.getMinutes() + 30);
const hours = now.getHours().toString().padStart(2, '0');
const minutes = now.getMinutes().toString().padStart(2, '0');
document.getElementById('liveClassStartTime').value = `${hours}:${minutes}`;
} catch (err) {
console.error('Error loading data for live class modal:', err);
}
}
document.getElementById('saveLiveClassBtn').addEventListener('click', async () => {
const liveClassData = {
class: document.getElementById('liveClassClassSelect').value,
date: document.getElementById('liveClassDate').value,
startTime: document.getElementById('liveClassStartTime').value,
teacher: document.getElementById('liveClassTeacherSelect').value,
classroom: document.getElementById('liveClassClassroomSelect').value,
notes: document.getElementById('liveClassNotes').value,
status: 'scheduled'
};
if (!liveClassData.class || !liveClassData.teacher || !liveClassData.classroom) {
Swal.fire('خطأ', 'يجب اختيار الحصة والأستاذ والقاعة', 'error');
return;
}

try {
const response = await fetch('/api/live-classes', {
method: 'POST',
headers: getAuthHeaders(),
body: JSON.stringify(liveClassData)
});

if (response.status === 401) {
logout();
return;
}

if (response.ok) {
Swal.fire('نجاح', 'تم إضافة الحصة بنجاح', 'success');
document.getElementById('addLiveClassForm').reset();
bootstrap.Modal.getInstance(document.getElementById('addLiveClassModal')).hide();
loadLiveClasses();
} else {
const error = await response.json();
Swal.fire('خطأ', error.error || 'حدث خطأ أثناء إضافة الحصة', 'error');
}
} catch (err) {
console.error('Error:', err);
Swal.fire('خطأ', 'حدث خطأ أثناء الاتصال بالخادم', 'error');
}
});
// Manual attendance functions
window.showManualAttendanceModal = async function(liveClassId) {
try {
// Load the live class data
const response = await fetch(`/api/live-classes/${liveClassId}`, {
headers: getAuthHeaders()
});

if (response.status === 401) {
logout();
return;
}

const liveClass = await response.json();

// Load enrolled students
const classResponse = await fetch(`/api/classes/${liveClass.class._id}`, {
headers: getAuthHeaders()
});
const classObj = await classResponse.json();

// Create HTML for the modal
const html = `
<div class="manual-attendance-container border rounded p-4 shadow-sm bg-light">
<h5 class="mb-3 text-primary fw-bold">
    <i class="bi bi-pencil-square me-2"></i> تسجيل الحضور يدوياً
</h5>
<p class="mb-2"><strong>الحصة:</strong> ${liveClass.class.name}</p>
<p class="mb-3"><strong>التاريخ:</strong> ${new Date(liveClass.date).toLocaleDateString('ar-EG')}</p>

<div class="mb-3">
    <label for="attendanceStudentSelect" class="form-label fw-semibold">اختر الطالب:</label>
    <select id="attendanceStudentSelect" class="form-select">
        ${classObj.students.map(student => `
            <option value="${student._id}">${student.name} (${student.studentId})</option>
        `).join('')}
    </select>
</div>

<div class="mb-3">
    <label for="attendanceStatus" class="form-label fw-semibold">حالة الحضور:</label>
    <select id="attendanceStatus" class="form-select">
        <option value="present">حاضر</option>
        <option value="late">متأخر</option>
        <option value="absent">غائب</option>
    </select>
</div>
</div>
`;      
const { value: formValues } = await Swal.fire({
title: 'تسجيل الحضور يدوياً',
html: html,
focusConfirm: false,
showCancelButton: true,
confirmButtonText: 'تسجيل',
cancelButtonText: 'إلغاء',
preConfirm: () => {
return {
    studentId: document.getElementById('attendanceStudentSelect').value,
    status: document.getElementById('attendanceStatus').value
};
}
});

if (formValues) {
// Submit attendance
const attendanceResponse = await fetch(`/api/live-classes/${liveClassId}/attendance`, {
method: 'POST',
headers: {
    'Content-Type': 'application/json',
    ...getAuthHeaders()
},
body: JSON.stringify(formValues)
});

if (attendanceResponse.ok) {
Swal.fire({
    icon: 'success',
    title: 'تم التسجيل بنجاح',
    text: 'تم تسجيل حضور الطالب بنجاح',
    confirmButtonText: 'حسناً'
});

// Refresh the live classes view
loadLiveClasses();
} else {
throw new Error('فشل في تسجيل الحضور');
}
}
} catch (err) {
console.error('Error:', err);
Swal.fire({
icon: 'error',
title: 'خطأ',
text: 'حدث خطأ أثناء محاولة تسجيل الحضور',
confirmButtonText: 'حسناً'
});
}
};

// RFID attendance handler
async function handleRFIDAttendance(uid) {
try {
// Find the current ongoing live class
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const response = await fetch(`/api/live-classes?status=ongoing&date=${today.toISOString()}`, {
headers: getAuthHeaders()
});

if (response.status === 401) {
logout();
return;
}

const liveClasses = await response.json();

if (liveClasses.length === 0) {
Swal.fire({
icon: 'info',
title: 'لا توجد حصة جارية',
text: 'لا يوجد حصص جارية حالياً لتسجيل الحضور',
confirmButtonText: 'حسناً'
});
return;
}

// For simplicity, we'll use the first ongoing class
const liveClass = liveClasses[0];

// Submit attendance via RFID
const attendanceResponse = await fetch(`/api/live-classes/${liveClass._id}/attendance`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
...getAuthHeaders()
},
body: JSON.stringify({
studentId: uid,
status: 'present',
method: 'rfid'
})
});

if (attendanceResponse.ok) {
const result = await attendanceResponse.json();

Swal.fire({
icon: 'success',
title: 'تم تسجيل الحضور',
html: `تم تسجيل حضور الطالب <strong>${result.student.name}</strong> في حصة <strong>${liveClass.class.name}</strong>`,
confirmButtonText: 'حسناً'
});
} else {
const error = await attendanceResponse.json();
throw new Error(error.error || 'فشل في تسجيل الحضور');
}
} catch (err) {
console.error('Error:', err);
Swal.fire({
icon: 'error',
title: 'خطأ',
text: err.message || 'حدث خطأ أثناء محاولة تسجيل الحضور',
confirmButtonText: 'حسناً'
});
}
}

// تبديل الوضع المظلم
const themeSwitcher = document.createElement('button');
themeSwitcher.className = 'theme-switcher';
themeSwitcher.innerHTML = '<i class="bi bi-moon-fill"></i>';
document.body.appendChild(themeSwitcher);

themeSwitcher.addEventListener('click', () => {
const currentTheme = document.documentElement.getAttribute('data-theme');
if (currentTheme === 'dark') {
document.documentElement.removeAttribute('data-theme');
themeSwitcher.innerHTML = '<i class="bi bi-moon-fill"></i>';
} else {
document.documentElement.setAttribute('data-theme', 'dark');
themeSwitcher.innerHTML = '<i class="bi bi-sun-fill"></i>';
}
});
// For main app footer
document.getElementById('app-current-year').textContent = new Date().getFullYear();
// After successful login, update header user info
function updateHeaderUserInfo() {
const user = getCurrentUser(); // Your function to get current user
document.getElementById('header-user-name').textContent = user.name;
document.getElementById('header-user-role').textContent = user.role;

// Also update the sidebar user info if needed
document.getElementById('user-name').textContent = user.name;
document.getElementById('user-role').textContent = user.role;
}

// Theme toggle functionality
document.getElementById('theme-toggle').addEventListener('click', function() {
document.body.setAttribute('data-theme', 
document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
this.innerHTML = document.body.getAttribute('data-theme') === 'dark' ? 
'<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-fill"></i>';
});
// Fixed searchStudents function
async function searchStudents() {
const searchTerm = document.getElementById('studentSearchInput').value.trim().toLowerCase();
try {
const response = await fetch('/api/students', {
    headers: getAuthHeaders()
});

if (response.status === 401) {
    logout();
    return;
}

const students = await response.json();

// Filter students based on search term
const filteredStudents = students.filter(student => {
    // If search term is empty, show all students
    if (!searchTerm) return true;
    
    // Check if search term matches any student property
    return (
        (student.name && student.name.toLowerCase().includes(searchTerm)) ||
        (student.studentId && student.studentId.toLowerCase().includes(searchTerm)) ||
        (student.parentName && student.parentName.toLowerCase().includes(searchTerm)) ||
        (student.academicYear && getAcademicYearName(student.academicYear).toLowerCase().includes(searchTerm))
    );
});

// Update the table with filtered results
const tableBody = document.getElementById('studentsTable');
tableBody.innerHTML = '';

if (filteredStudents.length === 0) {
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4 text-muted">لا توجد نتائج مطابقة للبحث</td>
        </tr>
    `;
    return;
}

filteredStudents.forEach((student, index) => {
    const row = document.createElement('tr');
// Modify your student table row to include the create account button
// Inside your loadStudents() function, update the action buttons:
// Modify your student table row to include the create account button
// Inside your loadStudents() function, update the action buttons:
// In your loadStudents() function, modify the table row to show account status
// In your loadStudents() function, modify the table row to show account status
// In your loadStudents() function, modify the table row to show account status
row.innerHTML = `
<td>${index + 1}</td>
<td>${student.name}</td>
<td>${student.studentId}</td>
<td>${student.parentName || '-'}</td>
<td>${getAcademicYearName(student.academicYear) || '-'}</td>
<td>${student.classes?.length || 0}</td>
<td>
${student.hasAccount ? 
'<span class="badge bg-success">لديه حساب</span>' : 
'<span class="badge bg-secondary">لا يوجد حساب</span>'}
</td>
<td>
<button class="btn btn-sm btn-outline-primary btn-action" onclick="editStudent('${student._id}')">
<i class="bi bi-pencil"></i>
</button>
<button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteStudent('${student._id}')">
<i class="bi bi-trash"></i>
</button>
${!student.hasAccount ? `
<button class="btn btn-sm btn-outline-info btn-action" onclick="showCreateAccountModal('${student._id}')">
    <i class="bi bi-person-plus"></i> إنشاء حساب
</button>
` : ''}
</td>
`;
    tableBody.appendChild(row);
});
} catch (err) {
console.error('Error searching students:', err);
Swal.fire('خطأ', 'حدث خطأ أثناء البحث', 'error');
}
}
async function searchPayments() {
const searchTerm = document.getElementById('paymentSearchInput').value.trim().toLowerCase();
try {
let url = '/api/payments';
const studentId = document.getElementById('paymentStudentSelect').value;
const classId = document.getElementById('paymentClassSelect').value;
const month = document.getElementById('paymentMonthSelect').value;

const params = [];
if (studentId) params.push(`student=${studentId}`);
if (classId) params.push(`class=${classId}`);
if (month) params.push(`month=${month}`);

if (params.length > 0) {
    url += `?${params.join('&')}`;
}

const response = await fetch(url, {
    headers: getAuthHeaders()
});

if (response.status === 401) {
    logout();
    return;
}

let payments = await response.json();

// Filter payments based on search term
const filteredPayments = payments.filter(payment => {
    // If search term is empty, show all payments
    if (!searchTerm) return true;
    
    // Check if search term matches any payment property
    return (
        (payment.student?.name && payment.student.name.toLowerCase().includes(searchTerm)) ||
        (payment.student?.studentId && payment.student.studentId.toLowerCase().includes(searchTerm)) ||
        (payment.class?.name && payment.class.name.toLowerCase().includes(searchTerm)) ||
        (payment.month && payment.month.toLowerCase().includes(searchTerm)) ||
        (payment.amount && payment.amount.toString().includes(searchTerm)) ||
        (payment.status && payment.status.toLowerCase().includes(searchTerm))
    );
});

// Update the table with filtered results
const tableBody = document.getElementById('paymentsTable');
tableBody.innerHTML = '';

if (filteredPayments.length === 0) {
    tableBody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-4 text-muted">لا توجد نتائج مطابقة للبحث</td>
        </tr>
    `;
    return;
}

filteredPayments.forEach((payment, index) => {
    const row = document.createElement('tr');
    row.classList.add(`payment-${payment.status}`);
    
    row.innerHTML = `
        <td>${index + 1}</td>
        <td>${payment.student?.name || 'غير معروف'} (${payment.student?.studentId || 'غير معروف'})</td>
        <td>${payment.class?.name || 'غير معروف'}</td>
        <td>${payment.month}</td>
        <td>${payment.amount} د.ك</td>
        <td>
            <span class="badge ${payment.status === 'paid' ? 'bg-success' : 
                            payment.status === 'pending' ? 'bg-warning' : 'bg-danger'}">
                ${payment.status === 'paid' ? 'مسدد' : 
                payment.status === 'pending' ? 'قيد الانتظار' : 'متأخر'}
            </span>
        </td>
        <td>${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('ar-EG') : '-'}</td>
        <td>
            <button class="btn btn-sm ${payment.status !== 'paid' ? 'btn-success' : 'btn-secondary'} btn-action" 
                onclick="showPaymentModal('${payment._id}')" 
                ${payment.status === 'paid' ? 'disabled' : ''}>
                <i class="bi bi-cash"></i>
            </button>
        </td>
    `;
    tableBody.appendChild(row);
});
} catch (err) {
console.error('Error searching payments:', err);
Swal.fire('خطأ', 'حدث خطأ أثناء البحث', 'error');
}
}

// Keep only one version of showPaymentModal (the more complete one)
window.showPaymentModal = async function(paymentId) {
try {
const paymentResponse = await fetch(`/api/payments/${paymentId}`, {
    headers: getAuthHeaders()
});

if (paymentResponse.status === 401) {
    logout();
    return;
}

const payment = await paymentResponse.json();

const { value: formValues } = await Swal.fire({
    title: 'تسديد الدفعة',
    html: `
        <div class="payment-modal-container p-3">
            <div class="mb-3">
                <label class="form-label">الطالب:</label>
                <input type="text" class="form-control" value="${payment.student?.name || 'غير معروف'}" readonly>
            </div>
            <div class="mb-3">
                <label class="form-label">الحصة:</label>
                <input type="text" class="form-control" value="${payment.class?.name || 'غير معروف'}" readonly>
            </div>
            <div class="mb-3">
                <label class="form-label">الشهر:</label>
                <input type="text" class="form-control" value="${payment.month || 'غير محدد'}" readonly>
            </div>
            <div class="mb-3">
                <label class="form-label">المبلغ:</label>
                <input type="text" class="form-control" value="${payment.amount || 0} د.ك" readonly>
            </div>
            <div class="mb-3">
                <label class="form-label">تاريخ الدفع:</label>
                <input type="date" id="payment-date" class="form-control" required>
            </div>
            <div class="mb-3">
                <label class="form-label">طريقة الدفع:</label>
                <select id="payment-method" class="form-select" required>
                    <option value="cash">نقدي</option>
                    <option value="bank">حوالة بنكية</option>
                    <option value="online">دفع إلكتروني</option>
                </select>
            </div>
        </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'تأكيد الدفع',
    cancelButtonText: 'إلغاء',
    preConfirm: () => {
        return {
            paymentDate: document.getElementById('payment-date').value,
            paymentMethod: document.getElementById('payment-method').value
        };
    }
});

if (formValues) {
    // Set default payment date to today if not provided
    if (!formValues.paymentDate) {
        formValues.paymentDate = new Date().toISOString().split('T')[0];
    }
    
    const response = await fetch(`/api/payments/${paymentId}/pay`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify(formValues)
    });
    
    if (response.ok) {
        Swal.fire({
            icon: 'success',
            title: 'تم التسديد بنجاح',
            text: 'تم تسجيل الدفعة بنجاح',
            confirmButtonText: 'حسناً'
        });
        
        // Refresh the students view
        if (payment.class?._id) {
            showClassStudents(payment.class._id);
        }
    } else {
        throw new Error('فشل في تسجيل الدفعة');
    }
}
} catch (err) {
console.error('Error:', err);
Swal.fire({
    icon: 'error',
    title: 'خطأ',
    text: 'حدث خطأ أثناء محاولة تسجيل الدفعة',
    confirmButtonText: 'حسناً'
});
}
};

// Keep only one version of unenrollStudent
window.unenrollStudent = async function(classId, studentId) {
try {
const { isConfirmed } = await Swal.fire({
    title: 'هل أنت متأكد؟',
    text: 'سيتم إزالة الطالب من الحصة وحذف مدفوعاته',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'نعم، إزالة',
    cancelButtonText: 'إلغاء'
});

if (isConfirmed) {
    const response = await fetch(`/api/classes/${classId}/unenroll/${studentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    
    if (response.status === 401) {
        logout();
        return;
    }
    
    if (response.ok) {
        Swal.fire('نجاح', 'تم إزالة الطالب من الحصة بنجاح', 'success');
        showClassStudents(classId);
        loadClasses();
        loadStudents();
    } else {
        const error = await response.json();
        Swal.fire('خطأ', error.error, 'error');
    }
}
} catch (err) {
console.error('Error:', err);
Swal.fire('خطأ', 'حدث خطأ أثناء إزالة الطالب', 'error');
}
};

async function searchCards() {
const searchTerm = document.getElementById('cardSearchInput').value.trim().toLowerCase();
const tableBody = document.getElementById('cardsTable');
tableBody.innerHTML = `
<tr>
    <td colspan="5" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
        </div>
    </td>
</tr>
`;
try {
const response = await fetch('/api/cards', {
    headers: getAuthHeaders()
});

if (response.status === 401) {
    logout();
    return;
}

const cards = await response.json();

// Filter cards based on search term
const filteredCards = cards.filter(card => {
    // If search term is empty, show all cards
    if (!searchTerm) return true;
    
    // Check if search term matches any card or student property
    return (
        (card.uid && card.uid.toLowerCase().includes(searchTerm)) ||
        (card.student?.name && card.student.name.toLowerCase().includes(searchTerm)) ||
        (card.student?.studentId && card.student.studentId.toLowerCase().includes(searchTerm)) ||
        (card.issueDate && new Date(card.issueDate).toLocaleDateString('ar-EG').includes(searchTerm))
    );
});

// Update the table with filtered results
const tableBody = document.getElementById('cardsTable');
tableBody.innerHTML = '';

if (filteredCards.length === 0) {
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-4 text-muted">لا توجد نتائج مطابقة للبحث</td>
        </tr>
    `;
    return;
}

filteredCards.forEach((card, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${index + 1}</td>
        <td>${card.uid}</td>
        <td>${card.student?.name || 'غير معين'} (${card.student?.studentId || 'غير معين'})</td>
        <td>${card.issueDate ? new Date(card.issueDate).toLocaleDateString('ar-EG') : 'غير معروف'}</td>
        <td>
            <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteCard('${card._id}')">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    tableBody.appendChild(row);
});
} catch (err) {
console.error('Error searching cards:', err);
Swal.fire('خطأ', 'حدث خطأ أثناء البحث في البطاقات', 'error');
}
}





















// Update the navigation between sections code to include the new section
document.querySelectorAll('[data-section]').forEach(link => {
link.addEventListener('click', function(e) {
e.preventDefault();

// Hide all sections
document.querySelectorAll('.content-section').forEach(section => {
section.classList.remove('active');
});

// Remove active from all links
document.querySelectorAll('.nav-link').forEach(navLink => {
navLink.classList.remove('active');
});

// Activate current link
this.classList.add('active');

// Show requested section
const sectionId = this.getAttribute('data-section');
document.getElementById(sectionId).classList.add('active');

// Load data when needed
if (sectionId === 'students') loadStudents();
else if (sectionId === 'teachers') loadTeachers();
else if (sectionId === 'classes') loadClasses();
else if (sectionId === 'classrooms') loadClassrooms();
else if (sectionId === 'payments') {
loadStudentsForPayments();
loadPayments();
}
else if (sectionId === 'cards') {
loadStudentsForCards();
loadCards();
}
else if (sectionId === 'registration-requests') {
loadRegistrationRequests();
}
});
});
// Load registration requests
// Update the loadRegistrationRequests function
// Update the loadRegistrationRequests function
async function loadRegistrationRequests() {
try {
const status = document.getElementById('requestStatusFilter').value;

const response = await fetch(`/api/registration-requests?status=${status}`, {
headers: getAuthHeaders()
});

if (response.status === 401) {
logout();
return;
}

const students = await response.json();

const tableBody = document.getElementById('registrationRequestsTable');
tableBody.innerHTML = '';

if (students.length === 0) {
tableBody.innerHTML = `
    <tr>
        <td colspan="9" class="text-center py-4 text-muted">لا توجد طلبات متاحة</td>
    </tr>
`;
return;
}

students.forEach((student, index) => {
const row = document.createElement('tr');
row.innerHTML = `
    <td>${index + 1}</td>
    <td>${student.name}</td>
    <td>${student.parentName || '-'}</td>
    <td>${student.parentPhone || '-'}</td>
    <td>${student.parentEmail || '-'}</td>
    <td>${getAcademicYearName(student.academicYear) || '-'}</td>
    <td>${new Date(student.registrationDate).toLocaleDateString('ar-EG')}</td>
    <td>
        <span class="badge ${student.status === 'active' ? 'bg-success' : 
                          student.status === 'pending' ? 'bg-warning' : 'bg-danger'}">
            ${student.status === 'active' ? 'مقبول' : 
             student.status === 'pending' ? 'قيد الانتظار' : 'مرفوض'}
        </span>
    </td>
    <td>
        <div class="btn-group">
            <button class="btn btn-sm btn-outline-primary" onclick="viewRegistrationDetails('${student._id}')">
                <i class="bi bi-eye"></i>
            </button>
            ${student.status === 'pending' ? `
                <button class="btn btn-sm btn-success" onclick="approveRegistration('${student._id}')">
                    <i class="bi bi-check-lg"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="rejectRegistration('${student._id}')">
                    <i class="bi bi-x-lg"></i>
                </button>
            ` : ''}
        </div>
    </td>
`;
tableBody.appendChild(row);
});
} catch (err) {
console.error('Error loading registration requests:', err);
Swal.fire('خطأ', 'حدث خطأ أثناء تحميل طلبات التسجيل', 'error');
}
}



// View registration details
async function viewRegistrationDetails(studentId) {
try {
const response = await fetch(`/api/students/${studentId}`, {
headers: getAuthHeaders()
});

const student = await response.json();

const html = `
<div class="registration-details">
    <div class="row mb-4">
        <div class="col-md-6">
            <h5>المعلومات الأساسية</h5>
            <p><strong>اسم الطالب:</strong> ${student.name}</p>
            <p><strong>تاريخ الميلاد:</strong> ${student.birthDate ? new Date(student.birthDate).toLocaleDateString('ar-EG') : 'غير محدد'}</p>
            <p><strong>السنة الدراسية:</strong> ${getAcademicYearName(student.academicYear) || 'غير محدد'}</p>
        </div>
        <div class="col-md-6">
            <h5>معلومات ولي الأمر</h5>
            <p><strong>اسم ولي الأمر:</strong> ${student.parentName || 'غير محدد'}</p>
            <p><strong>هاتف ولي الأمر:</strong> ${student.parentPhone || 'غير محدد'}</p>
            <p><strong>بريد ولي الأمر:</strong> ${student.parentEmail || 'غير محدد'}</p>
        </div>
    </div>
    
    ${student.registrationData ? `
        <div class="row mb-4">
            <div class="col-md-6">
                <h5>معلومات إضافية</h5>
                <p><strong>العنوان:</strong> ${student.registrationData.address || 'غير محدد'}</p>
                <p><strong>المدرسة السابقة:</strong> ${student.registrationData.previousSchool || 'غير محدد'}</p>
                <p><strong>معلومات صحية:</strong> ${student.registrationData.healthInfo || 'لا توجد'}</p>
            </div>
            <div class="col-md-6">
                <h5>الوثائق المرفقة</h5>
                ${student.registrationData.documents && student.registrationData.documents.length > 0 ? 
                    student.registrationData.documents.map(doc => `
                        <p>
                            <a href="${doc.url}" target="_blank" class="text-decoration-none">
                                ${doc.name} 
                                ${doc.verified ? '<span class="badge bg-success">تم التحقق</span>' : '<span class="badge bg-warning">لم يتم التحقق</span>'}
                            </a>
                        </p>
                    `).join('') : 
                    '<p>لا توجد وثائق مرفقة</p>'
                }
            </div>
        </div>
    ` : ''}
</div>
`;

Swal.fire({
title: 'تفاصيل طلب التسجيل',
html: html,
width: '900px',
showConfirmButton: false,
showCloseButton: true
});
} catch (err) {
console.error('Error:', err);
Swal.fire('خطأ', 'حدث خطأ أثناء جلب تفاصيل الطلب', 'error');
}
}



// Approve registration
async function approveRegistration(studentId) {
try {
const { value: formValues } = await Swal.fire({
title: 'تأكيد قبول الطلب',
html: `
    <p>هل أنت متأكد من قبول طلب التسجيل هذا؟</p>
    <div class="mb-3">
        <label for="officialStudentId" class="form-label">الرقم الجامعي:</label>
        <input type="text" class="form-control" id="officialStudentId" placeholder="سيتم إنشاؤه تلقائياً إذا ترك فارغاً">
    </div>
`,
showCancelButton: true,
confirmButtonText: 'نعم، قبول الطلب',
cancelButtonText: 'إلغاء',
preConfirm: () => {
    return {
        studentId: document.getElementById('officialStudentId').value
    };
}
});

if (formValues) {
const response = await fetch(`/api/admin/approve-student/${studentId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({
        status: 'active',
        studentId: formValues.studentId || undefined
    })
});

if (response.ok) {
    Swal.fire('نجاح', 'تم قبول طلب التسجيل بنجاح', 'success');
    loadRegistrationRequests();
    loadStudents();
} else {
    const error = await response.json();
    Swal.fire('خطأ', error.error || 'حدث خطأ أثناء قبول الطلب', 'error');
}
}
} catch (err) {
console.error('Error:', err);
Swal.fire('خطأ', 'حدث خطأ أثناء محاولة قبول الطلب', 'error');
}
}

async function rejectRegistration(studentId) {
try {
const { value: reason } = await Swal.fire({
title: 'سبب الرفض',
input: 'textarea',
inputLabel: 'الرجاء إدخال سبب رفض طلب التسجيل',
inputPlaceholder: 'أدخل السبب هنا...',
showCancelButton: true,
confirmButtonText: 'تأكيد الرفض',
cancelButtonText: 'إلغاء'
});

if (reason) {
const response = await fetch(`/api/students/${studentId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({
        status: 'rejected',
        rejectionReason: reason
    })
});

if (response.ok) {
    Swal.fire('نجاح', 'تم رفض طلب التسجيل بنجاح', 'success');
    loadRegistrationRequests();
} else {
    const error = await response.json();
    Swal.fire('خطأ', error.error || 'حدث خطأ أثناء رفض الطلب', 'error');
}
}
} catch (err) {
console.error('Error:', err);
Swal.fire('خطأ', 'حدث خطأ أثناء محاولة رفض الطلب', 'error');
}
}

// Load student accounts
// Load student accounts

// Create student account

// Load students for dropdown
async function loadStudentsForAccountCreation() {
try {
const response = await fetch('/api/students?hasAccount=false', {
headers: getAuthHeaders()
});

if (response.status === 401) {
logout();
return;
}

const students = await response.json();
const select = document.getElementById('accountStudentSelect');
select.innerHTML = '<option value="" selected disabled>اختر طالب...</option>';

students.forEach(student => {
const option = document.createElement('option');
option.value = student._id;
option.textContent = `${student.name} (${student.studentId || 'لا يوجد رقم'})`;
select.appendChild(option);
});
} catch (err) {
console.error('Error loading students:', err);
Swal.fire('خطأ', 'حدث خطأ أثناء تحميل قائمة الطلاب', 'error');
}
}

// Initialize when modal is shown
document.getElementById('addStudentAccountModal').addEventListener('show.bs.modal', function() {
loadStudentsForAccountCreation();

// Generate suggested username
document.getElementById('accountStudentSelect').addEventListener('change', function() {
const selectedOption = this.options[this.selectedIndex];
if (selectedOption.value) {
const studentId = selectedOption.textContent.match(/\(([^)]+)\)/)?.[1] || '';
document.getElementById('accountUsername').value = studentId || '';
}
});
});

// Set up form submission
document.getElementById('addStudentAccountForm').addEventListener('submit', function(e) {
e.preventDefault();
createStudentAccount();
});

// Initialize when section is shown
document.getElementById('student-accounts-link').addEventListener('click', function() {
loadStudentAccounts();
});
// Add event listener for save button
document.getElementById('saveStudentAccountBtn').addEventListener('click', async () => {
const password = document.getElementById('accountPassword').value;
const confirmPassword = document.getElementById('accountConfirmPassword').value;

if (password !== confirmPassword) {
Swal.fire('خطأ', 'كلمة المرور وتأكيدها غير متطابقين', 'error');
return;
}

const accountData = {
studentId: document.getElementById('accountStudentSelect').value,
username: document.getElementById('accountUsername').value,
password: password,
email: document.getElementById('accountEmail').value
};

try {
const response = await fetch('/api/student-accounts', {
method: 'POST',
headers: getAuthHeaders(),
body: JSON.stringify(accountData)
});

if (response.ok) {
Swal.fire('نجاح', 'تم إنشاء حساب الطالب بنجاح', 'success');
bootstrap.Modal.getInstance(document.getElementById('addStudentAccountModal')).hide();
loadStudentAccounts();
} else {
const error = await response.json();
Swal.fire('خطأ', error.error || 'حدث خطأ أثناء إنشاء الحساب', 'error');
}
} catch (err) {
console.error('Error:', err);
Swal.fire('خطأ', 'حدث خطأ أثناء الاتصال بالخادم', 'error');
}
});

// Load students for account creation dropdown


// Initialize when student accounts section is shown
document.getElementById('student-accounts-link').addEventListener('click', function() {
loadStudentAccounts();
loadStudentsForAccountCreation();
});

// Update the student account creation function
window.createStudentAccount = async function(studentId) {
try {
// First get student data
const studentResponse = await fetch(`/api/students/${studentId}`, {
headers: getAuthHeaders()
});

if (studentResponse.status === 401) {
logout();
return;
}

const student = await studentResponse.json();

// Generate a username and password
const username = student.studentId || `stu_${Date.now().toString().slice(-6)}`;
const password = generateRandomPassword(); // You'll need to implement this function

const accountData = {
username: username,
password: password,
role: 'student',
fullName: student.name,
phone: student.parentPhone,
email: student.parentEmail,
studentId: student.studentId
};

const response = await fetch('/api/student/create-account', {
method: 'POST',
headers: getAuthHeaders(),
body: JSON.stringify(accountData)
});

if (response.ok) {
const result = await response.json();

// Show success message with credentials
Swal.fire({
    title: 'تم إنشاء الحساب بنجاح',
    html: `
        <p>تم إنشاء حساب الطالب بنجاح</p>
        <div class="alert alert-info mt-3">
            <p><strong>اسم المستخدم:</strong> ${result.username}</p>
            <p><strong>كلمة المرور:</strong> ${password}</p>
        </div>
        <p class="text-muted mt-2">يرجى تدوين هذه المعلومات وإعطائها للطالب</p>
    `,
    confirmButtonText: 'تم',
    width: '600px'
});

// Refresh student accounts list
loadStudentAccounts();
} else {
const error = await response.json();
throw new Error(error.error || 'Failed to create account');
}
} catch (err) {
console.error('Error creating student account:', err);
Swal.fire({
icon: 'error',
title: 'خطأ',
text: err.message || 'حدث خطأ أثناء إنشاء الحساب',
confirmButtonText: 'حسناً'
});
}
};

// Helper function to generate random password
function generateRandomPassword(length = 8) {
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
let password = '';
for (let i = 0; i < length; i++) {
password += chars.charAt(Math.floor(Math.random() * chars.length));
}
return password;
}
// Student Accounts Functions
// Load student accounts
// Load student accounts
// Load student accounts
// Load student accounts
// Load student accounts
// Load student accounts



  // Render accounts table
function renderStudentAccountsTable(accounts) {
    const tableBody = document.getElementById('studentAccountsTable');
    tableBody.innerHTML = '';
  
    if (accounts.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4 text-muted">لا توجد حسابات متاحة</td>
        </tr>
      `;
      return;
    }
  
    accounts.forEach((account, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${account.username}</td>
        <td>${account.fullName || '-'}</td>
        <td>${account.studentId || '-'}</td>
        <td>${account.email || '-'}</td>
        <td>
          <span class="badge ${account.active ? 'bg-success' : 'bg-secondary'}">
            ${account.active ? 'نشط' : 'غير نشط'}
          </span>
        </td>
        <td>${new Date(account.createdAt).toLocaleDateString('ar-EG')}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-danger" onclick="deleteStudentAccount('${account._id}')">
              <i class="bi bi-trash"></i>
            </button>
            <button class="btn btn-outline-warning" onclick="showResetPasswordModal('${account._id}')">
              <i class="bi bi-key"></i>
            </button>
            <button class="btn btn-outline-secondary" onclick="toggleAccountStatus('${account._id}', ${account.active})">
              <i class="bi ${account.active ? 'bi-pause' : 'bi-play'}"></i>
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }
  // Show create account modal
async function showCreateAccountModal(studentId = null) {
    try {
      // Load students without accounts
      const response = await fetch('/api/students?hasAccount=false', {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
  
      const students = await response.json();
      const studentSelect = document.getElementById('accountStudentSelect');
      
      studentSelect.innerHTML = '<option value="" selected disabled>اختر طالب...</option>';
      students.forEach(student => {
        const option = document.createElement('option');
        option.value = student._id;
        option.textContent = `${student.name} (${student.studentId || 'بدون رقم'})`;
        if (studentId && student._id === studentId) option.selected = true;
        studentSelect.appendChild(option);
      });
  
      // If studentId provided, auto-fill username
      if (studentId) {
        const student = students.find(s => s._id === studentId);
        if (student) {
          document.getElementById('accountUsername').value = student.studentId || '';
          document.getElementById('accountEmail').value = student.parentEmail || '';
        }
      }
  
      // Show modal
      const modal = new bootstrap.Modal(document.getElementById('addStudentAccountModal'));
      modal.show();
    } catch (err) {
      console.error('Error:', err);
      Swal.fire('خطأ', 'حدث خطأ أثناء تحضير النموذج', 'error');
    }
  }
  
// Create student account
async function createStudentAccount() {
    const form = document.getElementById('addStudentAccountForm');
    const formData = new FormData(form);

    const accountData = {
        studentId: formData.get('accountStudentSelect'),
        username: formData.get('accountUsername').trim(),
        password: formData.get('accountPassword'),
        email: formData.get('accountEmail').trim()
    };

    // Validation
    if (!accountData.studentId) {
        Swal.fire('خطأ', 'يجب اختيار طالب', 'error');
        return;
    }

    if (!accountData.username) {
        Swal.fire('خطأ', 'يجب إدخال اسم المستخدم', 'error');
        return;
    }

    if (accountData.password !== formData.get('accountConfirmPassword')) {
        Swal.fire('خطأ', 'كلمة المرور وتأكيدها غير متطابقين', 'error');
        return;
    }

    try {
        const response = await fetch('/api/student-accounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(accountData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'حدث خطأ أثناء إنشاء الحساب');
        }

        const data = await response.json();
        Swal.fire('نجاح', 'تم إنشاء الحساب بنجاح', 'success');
        bootstrap.Modal.getInstance(document.getElementById('addStudentAccountModal')).hide();
        loadStudentAccounts();
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', err.message, 'error');
    }
}
  async function showResetPasswordModal(accountId) {
    const { value: newPassword } = await Swal.fire({
      title: 'إعادة تعيين كلمة المرور',
      html: `
        <input type="password" id="newPassword" class="swal2-input" placeholder="كلمة المرور الجديدة">
        <input type="password" id="confirmPassword" class="swal2-input" placeholder="تأكيد كلمة المرور">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'حفظ',
      cancelButtonText: 'إلغاء',
      preConfirm: () => {
        const password = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;
        
        if (!password || password.length < 6) {
          Swal.showValidationMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
          return false;
        }
        
        if (password !== confirm) {
          Swal.showValidationMessage('كلمة المرور وتأكيدها غير متطابقين');
          return false;
        }
        
        return { password };
      }
    });
  
    if (newPassword) {
      try {
        const response = await fetch(`/api/student-accounts/${accountId}/reset-password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify(newPassword)
        });
  
        if (response.ok) {
          Swal.fire('نجاح', 'تم تحديث كلمة المرور بنجاح', 'success');
        } else {
          const error = await response.json();
          throw new Error(error.error || 'حدث خطأ أثناء تحديث كلمة المرور');
        }
      } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', err.message, 'error');
      }
    }
  }
  async function deleteStudentAccount(accountId) {
    try {
      const { isConfirmed } = await Swal.fire({
        title: 'هل أنت متأكد؟',
        text: 'سيتم حذف الحساب ولن يتمكن الطالب من تسجيل الدخول',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'إلغاء'
      });
  
      if (isConfirmed) {
        const response = await fetch(`/api/student-accounts/${accountId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
  
        if (response.ok) {
          Swal.fire('نجاح', 'تم حذف الحساب بنجاح', 'success');
          loadStudentAccounts();
        } else {
          const error = await response.json();
          throw new Error(error.error || 'حدث خطأ أثناء الحذف');
        }
      }
    } catch (err) {
      console.error('Error:', err);
      Swal.fire('خطأ', err.message, 'error');
    }
  }
  
  // Show reset password modal
  async function showResetPasswordModal(accountId) {
    const { value: newPassword } = await Swal.fire({
      title: 'إعادة تعيين كلمة المرور',
      html: `
        <input type="password" id="newPassword" class="swal2-input" placeholder="كلمة المرور الجديدة">
        <input type="password" id="confirmPassword" class="swal2-input" placeholder="تأكيد كلمة المرور">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'حفظ',
      cancelButtonText: 'إلغاء',
      preConfirm: () => {
        const password = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;
        
        if (!password || password.length < 6) {
          Swal.showValidationMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
          return false;
        }
        
        if (password !== confirm) {
          Swal.showValidationMessage('كلمة المرور وتأكيدها غير متطابقين');
          return false;
        }
        
        return { password };
      }
    });
  
    if (newPassword) {
      try {
        const response = await fetch(`/api/student-accounts/${accountId}/reset-password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify(newPassword)
        });
  
        if (response.ok) {
          Swal.fire('نجاح', 'تم تحديث كلمة المرور بنجاح', 'success');
        } else {
          const error = await response.json();
          throw new Error(error.error || 'حدث خطأ أثناء تحديث كلمة المرور');
        }
      } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', err.message, 'error');
      }
    }
  }
  
  // Toggle account status
  async function toggleAccountStatus(accountId, currentStatus) {
    try {
      const response = await fetch(`/api/student-accounts/${accountId}/toggle-status`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
  
      if (response.ok) {
        const data = await response.json();
        Swal.fire('نجاح', data.message, 'success');
        loadStudentAccounts();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'حدث خطأ أثناء تغيير حالة الحساب');
      }
    } catch (err) {
      console.error('Error:', err);
      Swal.fire('خطأ', err.message, 'error');
    }
  }
    
  

// Load students for dropdown (only those without accounts)
async function loadStudentsForAccountCreation() {
    try {
        const response = await fetch('/api/students?hasAccount=false', {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            logout();
            return;
        }

        const students = await response.json();
        const select = document.getElementById('accountStudentSelect');
        select.innerHTML = '<option value="" selected disabled>اختر طالب...</option>';

        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student._id;
            option.textContent = `${student.name} (${student.studentId || 'لا يوجد رقم'})`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading students:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل قائمة الطلاب', 'error');
    }
}

// Initialize when modal is shown
document.getElementById('addStudentAccountModal').addEventListener('show.bs.modal', function() {
    loadStudentsForAccountCreation();

    // Generate suggested username based on student ID
    document.getElementById('accountStudentSelect').addEventListener('change', async function() {
        const studentId = this.value;
        if (studentId) {
            try {
                const response = await fetch(`/api/students/${studentId}`, {
                    headers: getAuthHeaders()
                });
                
                if (response.ok) {
                    const student = await response.json();
                    document.getElementById('accountUsername').value = student.studentId || '';
                    document.getElementById('accountEmail').value = student.parentEmail || '';
                }
            } catch (err) {
                console.error('Error fetching student:', err);
            }
        }
    });
});

// Set up form submission
document.getElementById('addStudentAccountForm').addEventListener('submit', function(e) {
    e.preventDefault();
    createStudentAccount();
});

// Function to load student accounts table
async function loadStudentAccounts() {
    try {
        const status = document.getElementById('accountStatusFilter').value;
        const searchTerm = document.getElementById('accountSearchInput').value.trim();
        
        let url = '/api/student-accounts';
        const params = [];
        
        if (status) params.push(`status=${status}`);
        if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
        
        if (params.length) url += `?${params.join('&')}`;

        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const accounts = await response.json();
        renderStudentAccountsTable(accounts);
    } catch (err) {
        console.error('Error loading student accounts:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل حسابات الطلاب', 'error');
    }
}

function renderStudentAccountsTable(accounts) {
    const tableBody = document.getElementById('studentAccountsTable');
    tableBody.innerHTML = '';

    if (!accounts || accounts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">لا توجد حسابات متاحة</td>
            </tr>
        `;
        return;
    }

    accounts.forEach((account, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${account.username}</td>
            <td>${account.fullName || '-'}</td>
            <td>${account.studentId || '-'}</td>
            <td>${account.email || '-'}</td>
            <td>
                <span class="badge ${account.active ? 'bg-success' : 'bg-secondary'}">
                    ${account.active ? 'نشط' : 'غير نشط'}
                </span>
            </td>
            <td>${new Date(account.createdAt).toLocaleDateString('ar-EG')}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteStudentAccount('${account._id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="showResetPasswordModal('${account._id}')">
                        <i class="bi bi-key"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="toggleAccountStatus('${account._id}', ${account.active})">
                        <i class="bi ${account.active ? 'bi-pause' : 'bi-play'}"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}
  function renderStudentAccountsTable(accounts) {
    const tableBody = document.getElementById('studentAccountsTable');
    tableBody.innerHTML = '';
  
    if (accounts.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">لا توجد حسابات متاحة</td>
        </tr>
      `;
      return;
    }
  
    accounts.forEach((account, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${account.username}</td>
        <td>${account.fullName || '-'}</td>
        <td>${account.studentId || '-'}</td>
        <td>${account.email || '-'}</td>
        <td>
          <span class="badge ${account.active ? 'bg-success' : 'bg-secondary'}">
            ${account.active ? 'نشط' : 'غير نشط'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteStudentAccount('${account._id}')">
            <i class="bi bi-trash"></i>
          </button>
          <button class="btn btn-sm btn-outline-warning" onclick="resetStudentPassword('${account._id}')">
            <i class="bi bi-key"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

// Function to delete a student account
// Delete student account
// Delete student account
window.deleteStudentAccount = async function(accountId) {
    try {
        const { isConfirmed } = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'سيتم حذف الحساب ولن يتمكن الطالب من تسجيل الدخول',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        });

        if (isConfirmed) {
            const response = await fetch(`/api/student-accounts/${accountId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                Swal.fire('نجاح', 'تم حذف الحساب بنجاح', 'success');
                loadStudentAccounts();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'حدث خطأ أثناء الحذف');
            }
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', err.message, 'error');
    }
};

// Show reset password modal
window.showResetPasswordModal = async function(accountId) {
    const { value: newPassword } = await Swal.fire({
        title: 'إعادة تعيين كلمة المرور',
        html: `
            <input type="password" id="newPassword" class="swal2-input" placeholder="كلمة المرور الجديدة">
            <input type="password" id="confirmPassword" class="swal2-input" placeholder="تأكيد كلمة المرور">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'حفظ',
        cancelButtonText: 'إلغاء',
        preConfirm: () => {
            const password = document.getElementById('newPassword').value;
            const confirm = document.getElementById('confirmPassword').value;
            
            if (!password || password.length < 6) {
                Swal.showValidationMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
                return false;
            }
            
            if (password !== confirm) {
                Swal.showValidationMessage('كلمة المرور وتأكيدها غير متطابقين');
                return false;
            }
            
            return { password };
        }
    });

    if (newPassword) {
        try {
            const response = await fetch(`/api/student-accounts/${accountId}/reset-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify(newPassword)
            });

            if (response.ok) {
                Swal.fire('نجاح', 'تم تحديث كلمة المرور بنجاح', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.error || 'حدث خطأ أثناء تحديث كلمة المرور');
            }
        } catch (err) {
            console.error('Error:', err);
            Swal.fire('خطأ', err.message, 'error');
        }
    }
};

// Toggle account status
window.toggleAccountStatus = async function(accountId, currentStatus) {
    try {
        const response = await fetch(`/api/student-accounts/${accountId}/toggle-status`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            Swal.fire('نجاح', data.message, 'success');
            loadStudentAccounts();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'حدث خطأ أثناء تغيير حالة الحساب');
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', err.message, 'error');
    }
};

// Function to reset student password
window.resetStudentPassword = async function(accountId) {
    try {
        const { value: newPassword } = await Swal.fire({
            title: 'إعادة تعيين كلمة المرور',
            input: 'text',
            inputLabel: 'كلمة المرور الجديدة',
            inputPlaceholder: 'أدخل كلمة المرور الجديدة',
            showCancelButton: true,
            confirmButtonText: 'حفظ',
            cancelButtonText: 'إلغاء',
            inputValidator: (value) => {
                if (!value) {
                    return 'يجب إدخال كلمة مرور جديدة';
                }
            }
        });

        if (newPassword) {
            const response = await fetch(`/api/student-accounts/${accountId}/reset-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ password: newPassword })
            });

            if (response.ok) {
                Swal.fire('نجاح', 'تم تحديث كلمة المرور بنجاح', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.error || 'حدث خطأ أثناء تحديث كلمة المرور');
            }
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', err.message, 'error');
    }
};

// Initialize when student accounts section is shown
document.getElementById('student-accounts-link').addEventListener('click', function() {
    loadStudentAccounts();
});

// Search functionality for student accounts
document.getElementById('accountSearchInput').addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
        loadStudentAccounts();
    }
});

// Filter functionality for student accounts
document.getElementById('accountStatusFilter').addEventListener('change', function() {
    loadStudentAccounts();
});

// Helper function to show create account modal for a specific student
// Show create account modal
window.showCreateAccountModal = async function(studentId = null) {
    try {
        // Load students without accounts
        const response = await fetch('/api/students?hasAccount=false', {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return;
        }

        const students = await response.json();
        const studentSelect = document.getElementById('accountStudentSelect');
        
        studentSelect.innerHTML = '<option value="" selected disabled>اختر طالب...</option>';
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student._id;
            option.textContent = `${student.name} (${student.studentId || 'بدون رقم'})`;
            if (studentId && student._id === studentId) option.selected = true;
            studentSelect.appendChild(option);
        });

        // If studentId provided, auto-fill username
        if (studentId) {
            const student = students.find(s => s._id === studentId);
            if (student) {
                document.getElementById('accountUsername').value = student.studentId || '';
                document.getElementById('accountEmail').value = student.parentEmail || '';
            }
        }

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addStudentAccountModal'));
        modal.show();
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء تحضير النموذج', 'error');
    }
};

// Create student account
window.createStudentAccount = async function() {
    const form = document.getElementById('addStudentAccountForm');
    const formData = new FormData(form);

    const accountData = {
        studentId: formData.get('accountStudentSelect'),
        username: formData.get('accountUsername').trim(),
        password: formData.get('accountPassword'),
        email: formData.get('accountEmail').trim()
    };

    // Validation
    if (!accountData.studentId) {
        Swal.fire('خطأ', 'يجب اختيار طالب', 'error');
        return;
    }

    if (!accountData.username) {
        Swal.fire('خطأ', 'يجب إدخال اسم المستخدم', 'error');
        return;
    }

    if (accountData.password !== formData.get('accountConfirmPassword')) {
        Swal.fire('خطأ', 'كلمة المرور وتأكيدها غير متطابقين', 'error');
        return;
    }

    try {
        const response = await fetch('/api/student-accounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(accountData)
        });

        const data = await response.json();

        if (response.ok) {
            Swal.fire({
                title: 'نجاح',
                html: `
                    <p>تم إنشاء حساب الطالب بنجاح</p>
                    <div class="alert alert-info mt-3">
                        <p><strong>اسم المستخدم:</strong> ${data.account.username}</p>
                        <p><strong>الطالب:</strong> ${data.account.studentName}</p>
                        <p><strong>الرقم الجامعي:</strong> ${data.account.studentId}</p>
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'تم',
                width: '600px'
            });

            form.reset();
            bootstrap.Modal.getInstance(document.getElementById('addStudentAccountModal')).hide();
            loadStudentAccounts();
        } else {
            throw new Error(data.error || 'حدث خطأ أثناء إنشاء الحساب');
        }
    } catch (err) {
        console.error('Error:', err);
        Swal.fire('خطأ', err.message, 'error');
    }
};




// Add this in your initialization code
// Add this to your initialization code
document.addEventListener('DOMContentLoaded', function() {
      initStudentAccountsSection();
      
// Set up the form submission
const accountForm = document.getElementById('addStudentAccountForm');
if (accountForm) {
accountForm.addEventListener('submit', function(e) {
e.preventDefault();
createStudentAccount();
});
}
});

function initStudentAccountsSection() {
    // Load accounts on section show
    document.getElementById('student-accounts-link').addEventListener('click', loadStudentAccounts);
}

document.getElementById('addStudentAccountForm').addEventListener('submit', function(e) {
    e.preventDefault();
    createStudentAccount();
  });


function saveStudentAccount() {
const studentId = document.getElementById('accountStudentSelect').value;
const username = document.getElementById('accountUsername').value.trim();
const password = document.getElementById('accountPassword').value;
const confirmPassword = document.getElementById('accountConfirmPassword').value;
const email = document.getElementById('accountEmail').value.trim();

console.log(studentId, username, password, confirmPassword, email);


// Validation
if (!studentId) {
Swal.fire('خطأ', 'يجب اختيار طالب', 'error');
return;
}

if (!username) {
Swal.fire('خطأ', 'يجب إدخال اسم المستخدم', 'error');
return;
}

// Add more validation as needed

// Prepare data
const accountData = {
studentId: studentId,
username: username,
password: password,
email: email
};

// Send request
// In saveStudentAccount() function
fetch('/api/student-accounts', {
method: 'POST',  // Changed from PUT to POST
headers: {
'Content-Type': 'application/json',
...getAuthHeaders()
},
body: JSON.stringify(accountData)
})
.then(response => {
if (response.ok) {
Swal.fire('نجاح', 'تم حفظ الحساب بنجاح', 'success');
} else {
response.json().then(error => {
throw new Error(error.message || 'حدث خطأ أثناء حفظ الحساب');
});
}
})
.catch(err => {
console.error('Error saving account:', err);
Swal.fire('خطأ', err.message || 'حدث خطأ أثناء حفظ الحساب', 'error');
});
}


// Global variable to store the connected device
let rfidDevice = null;

// Function to request USB device access
async function connectRFIDReader() {
  try {
    // Filter for STid devices (you'll need the correct vendor/product IDs)
    const device = await navigator.usb.requestDevice({
      filters: [
        { vendorId: 0x0483 }, // STMicroelectronics vendor ID
        { vendorId: 0x0403 }  // FTDI (common for USB-to-serial)
      ]
    });
    
    console.log('Device selected:', device);
    
    // Open the device
    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    
    // Claim the interface
    await device.claimInterface(0);
    
    rfidDevice = device;
    Swal.fire('Success', 'RFID reader connected successfully', 'success');
    
    // Start listening for RFID tags
    startRFIDListening();
    
  } catch (error) {
    console.error('Error connecting to RFID reader:', error);
    Swal.fire('Error', 'Failed to connect to RFID reader: ' + error.message, 'error');
  }
}

// Function to start listening for RFID tags
async function startRFIDListening() {
  if (!rfidDevice) return;
  
  try {
    // STid readers typically use a simple serial protocol
    // You'll need to send the correct initialization commands
    await rfidDevice.transferOut(1, new TextEncoder().encode('\x02\x30\x31\x03')); // Example command
    
    // Continuously read data
    while (rfidDevice.opened) {
      const result = await rfidDevice.transferIn(1, 64);
      if (result.data && result.data.byteLength > 0) {
        const decoder = new TextDecoder();
        const data = decoder.decode(result.data);
        
        // Process the RFID data (this will vary by reader model)
        const uid = extractUIDFromData(data);
        if (uid) {
          handleDetectedRFID(uid);
        }
      }
    }
  } catch (error) {
    console.error('RFID reading error:', error);
    if (rfidDevice) {
      await disconnectRFIDReader();
    }
  }
}

// Function to extract UID from reader data
function extractUIDFromData(data) {
  // STid readers typically send data in format [STX][DATA][ETX][LRC]
  // Example: "\x0212345678\x03\x2A"
  const match = data.match(/\x02(.+?)\x03/);
  return match ? match[1] : null;
}

// Function to disconnect the reader
async function disconnectRFIDReader() {
  if (rfidDevice) {
    try {
      await rfidDevice.releaseInterface(0);
      await rfidDevice.close();
      rfidDevice = null;
      console.log('RFID reader disconnected');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }
}

// Modify your existing RFID handling
function handleDetectedRFID(uid) {
  // Clear any previous results
  const rfidResult = document.getElementById('rfid-result');
  
  // Show the detected UID
  rfidResult.innerHTML = `
    <div class="alert alert-info">
      <h4>Card Detected</h4>
      <p>UID: ${uid}</p>
      <button class="btn btn-primary" onclick="showAssignCardModal('${uid}')">
        Assign Card to Student
      </button>
    </div>
  `;
  
  // Check if we have an ongoing class for attendance
  checkForOngoingClass(uid);
}
document.getElementById('connectRFIDBtn').addEventListener('click', function() {
    const rfidStatus = document.getElementById('rfidStatus');
    rfidStatus.textContent = 'Connecting...';
    rfidStatus.className = 'badge bg-warning';
    
    // Simulate connection
    setTimeout(() => {
      rfidStatus.textContent = 'Connected';
      rfidStatus.className = 'badge bg-success connected';
      document.getElementById('connectRFIDBtn').disabled = true;
      document.getElementById('disconnectRFIDBtn').disabled = false;
      
      // Simulate card scan
      simulateCardScan();
    }, 2000);
  });
  
  
  document.getElementById('disconnectRFIDBtn').addEventListener('click', function() {
    const rfidStatus = document.getElementById('rfidStatus');
    rfidStatus.textContent = 'Disconnected';
    rfidStatus.className = 'badge bg-danger disconnected';
    document.getElementById('connectRFIDBtn').disabled = false;
    document.getElementById('disconnectRFIDBtn').disabled = true;
    document.getElementById('rfid-result').innerHTML = '<p class="text-muted">قم بتمرير بطاقة الطالب لعرض المعلومات</p>';
  });



async function printRegistrationReceipt(studentData, amount = 600) {
    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        const doc = iframe.contentWindow.document;
        
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>إيصال تسجيل طالب</title>
                <style>
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        width: 210mm;
                        height: 297mm;
                        margin: 0;
                        padding: 0;
                        font-family: 'Arial', sans-serif;
                        color: #333;
                        line-height: 1.6;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .receipt-container {
                        width: 150mm;
                        height: auto;
                        border: 2px solid #3498db;
                        border-radius: 5px;
                        padding: 10mm;
                        box-sizing: border-box;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    .logo-container {
                        background-color: #000;
                        padding: 10px;
                        border-radius: 5px;
                        display: inline-block;
                        margin-bottom: 15px;
                    }
                    .logo {
                        height: 40px;
                        filter: brightness(0) invert(1);
                        
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 15px;
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 10px;
                    }
                    .title {
                        color: #2c3e50;
                        margin: 10px 0 5px;
                        font-size: 20px;
                    }
                    .subtitle {
                        color: #7f8c8d;
                        font-size: 12px;
                    }
                    .receipt-details {
                        margin: 15px 0;
                    }
                    .detail-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 10px;
                        padding-bottom: 6px;
                        border-bottom: 1px dashed #ddd;
                        font-size: 12px;
                    }
                    .detail-label {
                        font-weight: bold;
                        color: #2c3e50;
                        width: 40%;
                    }
                    .detail-value {
                        color: #34495e;
                        width: 60%;
                        text-align: left;
                    }
                    .amount-section {
                        background-color: #f8f9fa;
                        padding: 10px;
                        border-radius: 5px;
                        margin: 15px 0;
                        text-align: center;
                        border: 1px solid #eee;
                    }
                    .amount {
                        font-size: 22px;
                        color: #e74c3c;
                        font-weight: bold;
                        margin: 5px 0;
                    }
                    .barcode {
                        text-align: center;
                        margin: 15px 0;
                        padding: 8px;
                        background-color: #f8f9fa;
                        border-radius: 5px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 10px;
                        color: #7f8c8d;
                        border-top: 2px solid #3498db;
                        padding-top: 8px;
                    }
                    .signature {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 30px;
                    }
                    .signature-line {
                        border-top: 1px solid #333;
                        width: 150px;
                        text-align: center;
                        padding-top: 5px;
                        font-size: 10px;
                    }
                    .watermark {
                        position: absolute;
                        opacity: 0.05;
                        font-size: 80px;
                        color: #3498db;
                        transform: rotate(-30deg);
                        left: 50%;
                        top: 50%;
                        z-index: 0;
                        font-weight: bold;
                        pointer-events: none;
                    }
                </style>
            </head>
            <body>
                <div class="receipt-container">
                    <div class="watermark">${studentData.studentId}</div>
                    
                    <div class="header">
                        <div class="logo-container">
                            <img src="https://redoxcsl.web.app/assets/redox-icon.png" class="logo">
                        </div>
                        <h1 class="title">إيصال تسجيل طالب</h1>
                        <p class="subtitle">${new Date().toLocaleDateString('ar-EG', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</p>
                    </div>
                    
                    <div class="receipt-details">
                        <div class="detail-row">
                            <span class="detail-label">رقم الإيصال:</span>
                            <span class="detail-value">REG-${Date.now().toString().slice(-6)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">اسم الطالب:</span>
                            <span class="detail-value">${studentData.name}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">رقم الطالب:</span>
                            <span class="detail-value">${studentData.studentId}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">تاريخ الميلاد:</span>
                            <span class="detail-value">${studentData.birthDate ? new Date(studentData.birthDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">ولي الأمر:</span>
                            <span class="detail-value">${studentData.parentName || 'غير محدد'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">هاتف ولي الأمر:</span>
                            <span class="detail-value">${studentData.parentPhone || 'غير محدد'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">السنة الدراسية:</span>
                            <span class="detail-value">${getAcademicYearName(studentData.academicYear) || 'غير محدد'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">تاريخ التسجيل:</span>
                            <span class="detail-value">${new Date(studentData.registrationDate || new Date()).toLocaleDateString('ar-EG')}</span>
                        </div>
                    </div>
                    
                    <div class="amount-section">
                        <h3>المبلغ المدفوع</h3>
                        <div class="amount">${amount} دينار جزائري</div>
                        <p>(${convertNumberToArabicWords(amount)} ديناراً فقط لا غير)</p>
                    </div>
                    
                    <div class="barcode">
                        <svg id="barcode"></svg>
                    </div>
                    
                    <div class="signature">
                        <div class="signature-line">توقيع المسؤول</div>
                        <div class="signature-line">توقيع ولي الأمر</div>
                    </div>
                    
                    <div class="footer">
                        <p>شكراً لثقتكم بنا - نتمنى لطالبنا النجاح والتوفيق</p>
                        <p>للاستفسار: 1234567890 - info@school.com</p>
                    </div>
                </div>
                
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                <script>
                    JsBarcode("#barcode", "${studentData.studentId}", {
                        format: "CODE128",
                        lineColor: "#2c3e50",
                        width: 1.5,
                        height: 50,
                        displayValue: true,
                        fontSize: 12,
                        margin: 5
                    });
                    
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            setTimeout(function() {
                                window.close();
                            }, 500);
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        doc.close();
        
        iframe.contentWindow.onafterprint = function() {
            document.body.removeChild(iframe);
            resolve();
        };
    });
}
function simulateCardScan() {
    setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance to detect a card
        const cardUid = Math.random().toString(36).substring(2, 10).toUpperCase();
        document.getElementById('rfid-result').innerHTML = `
          <div class="alert alert-success">
            <h5>تم اكتشاف بطاقة!</h5>
            <p>رقم البطاقة: <strong>${cardUid}</strong></p>
            <button class="btn btn-sm btn-primary mt-2">عرض معلومات الطالب</button>
          </div>
        `;
      }
    }, 3000);
  }
  
  function loadSectionData(sectionId) {
    // In a real app, this would fetch data from the server
    console.log(`Loading data for ${sectionId} section`);
    
    switch(sectionId) {
      case 'dashboard':
        updateDashboardCounters();
        break;
      case 'students':
        loadStudentsTable();
        break;
      case 'teachers':
        loadTeachersTable();
        break;
      case 'classes':
        loadClassesTable();
        break;
      case 'classrooms':
        loadClassroomsTable();
        break;
      case 'payments':
        loadPaymentsTable();
        break;
      case 'cards':
        loadCardsTable();
        break;
      case 'student-accounts':
        loadStudentAccountsTable();
        break;
      case 'registration-requests':
        loadRegistrationRequestsTable();
        break;
      case 'live-classes':
        loadLiveClassesTable();
        break;
    }
  }
  