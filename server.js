
  require('dotenv').config();
  const express = require('express');
  const mongoose = require('mongoose');
  const { SerialPort } = require('serialport');
  const { ReadlineParser } = require('@serialport/parser-readline');
  const socketio = require('socket.io');
  const path = require('path');
  const cors = require('cors');
  const moment = require('moment');
  const jwt = require('jsonwebtoken');
  const bcrypt = require('bcryptjs');
  const nodemailer = require('nodemailer');
  const smsGateway = require('./sms-gateway');

  const app = express();
  const server = require('http').createServer(app);

  const io = socketio(server, {
    cors: {
      origin: "http://localhost:3000", // or "*" for development
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true
    },
    transports: ['websocket', 'polling'] // Add this line

  });

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));


  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));

  // Database Models
  const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'secretary', 'accountant', 'teacher'], required: true },
    fullName: String,
    phone: String,
    email: String,
    createdAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true }
  });

  const StudentsAccountsSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: String,
    studentId : { type: String, required: true, unique: true },
    role: { type: String, enum: ['student'], required: true },
    createdAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' } // Add this line

  },{  strictPopulate: false 
  })

  const studentSchema = new mongoose.Schema({
    name: { type: String, required: true }, 
    studentId: { 
      type: String, 
      unique: true,
      default: function() {
        // إنشاء معرف فريد عند الإنشاء
        return 'STU-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      }
    },
    birthDate: Date,
    parentName: String,
    parentPhone: { type: String, required: true },
    parentEmail: { type: String, required: false },
    registrationDate: { type: Date, default: Date.now },
    active: { type: Boolean, default: true }, // Changed default to false
    academicYear: { 
      type: String, 
      enum: ['1AS', '2AS', '3AS', '1MS', '2MS', '3MS', '4MS', '5MS' ,'1AP','2AP','3AP','4AP','5AP','NS', null , 'اولى ابتدائي', 'ثانية ابتدائي', 'ثالثة ابتدائي', 'رابعة ابتدائي', 'خامسة ابتدائي', 'غير محدد'],
      required: true
    },
    new : { type: Boolean, default: true }, 
    classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    status: { 
      type: String, 
      enum: ['pending', 'active', 'inactive', 'banned'], 
      default: 'pending' // New status for registration flow
    },
    registrationData: { // Store additional registration info
      address: String,
      previousSchool: String,
      healthInfo: String,
      documents: [{
        name: String,
        url: String,
        verified: { type: Boolean, default: false }
      }]
    }
  }, { strictPopulate: false });

  const teacherSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subjects: [{ type: String, enum: ['رياضيات', 'فيزياء', 'علوم', 'لغة عربية', 'لغة فرنسية', 'لغة انجليزية', 'تاريخ', 'جغرافيا', 'فلسفة', 'إعلام آلي'] }],
    phone: String,
    email: String,
    hireDate: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
    salaryPercentage: { type: Number, default: 0.7 }
  });

  const classroomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    capacity: Number,
    location: String
  });

  const classSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subject: { type: String, enum: ['رياضيات', 'فيزياء', 'علوم', 'لغة عربية', 'لغة فرنسية', 'لغة انجليزية', 'تاريخ', 'جغرافيا', 'فلسفة', 'إعلام آلي'] },
    description: String,
    schedule: [{
      day: { type: String, enum: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'] },
      time: String,
      classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }
    }],
    academicYear: { type: String, enum: ['1AS', '2AS', '3AS', '1MS', '2MS', '3MS', '4MS', '5MS','1AP','2AP','3AP','4AP','5AP','NS'] },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    price: { type: Number, required: true }
  });

  const attendanceSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  });

  const cardSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    issueDate: { type: Date, default: Date.now }
  });

  const paymentSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    amount: { type: Number, required: true },
    month: { type: String, required: true },
    paymentDate: { type: Date, default: null },
    status: { type: String, enum: ['paid', 'pending', 'late'], default: 'pending' },
    paymentMethod: { type: String, enum: ['cash', 'bank', 'online'], default: 'cash' },
    invoiceNumber: String,
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  });

  const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipients: [{
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
      parentPhone: String,
      parentEmail: String
    }],
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    content: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    messageType: { type: String, enum: ['individual', 'group', 'class', 'payment'] },
    status: { type: String, enum: ['sent', 'failed'], default: 'sent' }
  });

  const financialTransactionSchema = new mongoose.Schema({
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true },
    description: String,
    category: { type: String, enum: ['tuition', 'salary', 'rent', 'utilities', 'supplies', 'other'] },
    date: { type: Date, default: Date.now },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reference: String
  });
  // Add this near other schemas
  const liveClassSchema = new mongoose.Schema({
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
    status: { type: String, enum: ['scheduled', 'ongoing', 'completed', 'cancelled'], default: 'scheduled' },
    attendance: [{
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
      status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
      joinedAt: { type: Date },
      leftAt: { type: Date }
    }],
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  }, { timestamps: true });



  const LiveClass = mongoose.model('LiveClass', liveClassSchema);

  const User = mongoose.model('User', userSchema);
  const Student = mongoose.model('Student', studentSchema);
  const Teacher = mongoose.model('Teacher', teacherSchema);
  const Classroom = mongoose.model('Classroom', classroomSchema);
  const Class = mongoose.model('Class', classSchema);
  const Attendance = mongoose.model('Attendance', attendanceSchema);
  const Card = mongoose.model('Card', cardSchema);
  const Payment = mongoose.model('Payment', paymentSchema);
  const Message = mongoose.model('Message', messageSchema);
  const FinancialTransaction = mongoose.model('FinancialTransaction', financialTransactionSchema);
  const StudentAccount = mongoose.model('StudentAccount', StudentsAccountsSchema);
  // RFID Reader Implementation
  let serialPort = null;

  function initializeRFIDReader() {
    const portName = process.env.RFID_PORT;
    const baudRate = parseInt(process.env.RFID_BAUD_RATE) || 9600;

    if (!portName) {
      console.error('RFID_PORT not configured in .env file');
      return;
    }

    console.log(`Attempting to connect to RFID reader on ${portName}...`);

    // Close existing port if it exists
    if (serialPort && serialPort.isOpen) {
      serialPort.close();
    }

    try {
      serialPort = new SerialPort({
        path: portName,
        baudRate: baudRate,
        lock: false
      }, (err) => {
        if (err) {
          console.error(`Failed to open RFID port ${portName}:`, err.message);
          console.log('Retrying in 5 seconds...');
          setTimeout(initializeRFIDReader, 500000);
          return;
        }
        console.log(`RFID reader connected successfully on ${portName}`);
      });

      const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      parser.on('data', async (data) => {
        console.log('Raw RFID data:', data); // Debug output
        
        if (data.length > 0) {
          const uid = data.trim();
          console.log('Potential UID:', uid);
          io.emit('raw-data', { data, uid }); // Send to frontend for debugging
        }

        if (data.startsWith('UID:')) {
          const uid = data.trim().substring(4).trim();
          console.log('Card detected:', uid);

          try {
            const card = await Card.findOne({ uid }).populate('student');
            if (card) {
              const student = await Student.findById(card.student._id)
                .populate({
                  path: 'classes',
                  populate: [
                    { path: 'teacher', model: 'Teacher' },
                    { path: 'students', model: 'Student' }
                  ]
                });

              const payments = await Payment.find({ student: card.student._id, status: { $in: ['pending', 'late'] } })
                .populate('class');

              // Check if any class is scheduled now
              const now = new Date();
              const day = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][now.getDay()];
              const currentHour = now.getHours();
              const currentMinute = now.getMinutes();

              let currentClass = null;

              for (const cls of student.classes || []) {
                for (const schedule of cls.schedule || []) {
                  if (schedule.day === day) {
                    const [hour, minute] = schedule.time.split(':').map(Number);
                    if (Math.abs((hour - currentHour) * 60 + (minute - currentMinute)) <= 30) {
                      currentClass = cls;
                      break;
                    }
                  }
                }
                if (currentClass) break;
              }

              if (currentClass) {
                // Record attendance
                const attendance = new Attendance({
                  student: student._id,
                  class: currentClass._id,
                  date: now,
                  status: 'present'
                });
                await attendance.save();

                // Send SMS to parent
                // const smsContent = `تم تسجيل حضور الطالب ${student.name} في حصة ${currentClass.name} في ${now.toLocaleString()}`;

                try {
                  await smsGateway.send(student.parentPhone, smsContent);
                  await Message.create({
                    sender: null,
                    recipients: [{ student: student._id, parentPhone: student.parentPhone }],
                    class: currentClass._id,
                    content: smsContent,
                    messageType: 'individual'
                  });
                } catch (smsErr) {
                  console.error('Failed to send SMS:', smsErr);
                }
              }

              io.emit('student-detected', {
                student,
                card,
                classes: student.classes || [],
                payments: payments || [],
                currentClass
              });
            } else {
              io.emit('unknown-card', { uid });
            }
          } catch (err) {
            console.error('Error processing card:', err);
            io.emit('card-error', { error: 'Error processing card' });
          }
        }
      });

      serialPort.on('error', err => {
        console.error('RFID reader error:', err.message);
        setTimeout(initializeRFIDReader, 5000);
      });
      s
      serialPort.on('close', () => {
        console.log('RFID port closed, attempting to reconnect...');
        setTimeout(initializeRFIDReader, 5000);
      });

    } catch (err) {
      console.error('RFID initialization error:', err.message);
      // setTimeout(initializeRFIDReader, 5000);
    }
  }

  // Connect to MongoDB
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Database connection successful'))
    .catch(err => console.error("Error connecting to Database:", err));

  // JWT Authentication Middleware
  const authenticate = (roles = []) => {
    return (req, res, next) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'غير مصرح بالدخول' });

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        if (roles.length && !roles.includes(decoded.role)) {
          return res.status(403).json({ error: 'غير مصرح بالوصول لهذه الصلاحية' });
        }

        next();
      } catch (err) {
        res.status(401).json({ error: 'رمز الدخول غير صالح' });
      }
    };
  };

  // Email Configuration
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  // API Routes

  // Auth Routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
      }

      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({ token, user: { username: user.username, role: user.role, fullName: user.fullName } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/change-password', authenticate(), async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);

      if (!(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Users Management (Admin only)
  app.get('/api/users', authenticate(['admin']), async (req, res) => {
    try {
      const users = await User.find().select('-password');
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const { username, password, role, ...rest } = req.body;

      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'اسم المستخدم موجود مسبقا' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        username,
        password: hashedPassword,
        role,
        ...rest
      });

      await user.save();

      res.status(201).json({
        _id: user._id,
        username: user.username,
        role: user.role,
        fullName: user.fullName
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Students
  // get only active students
  app.get('/api/students', /* authenticate(['admin', 'secretary', 'accountant']), */ async (req, res) => {
    try {
      const { academicYear, active } = req.query;

  //   if (academicYear) query.academicYear = academicYear;
      if (active) query.active = active === true;

      const students = await Student.find({status : 'active' }).sort({ name: 1 });

      res.json(students);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  //get all students
  app.get('/api/allstudents',/* authenticate(['admin', 'secretary', 'accountant']), */ ()=>{
    try {
      const students = Student.find();
      res.json(students);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  })
  // activate student
  app.put('/api/students/:id/activate', authenticate(['admin', 'secretary']), async (req, res) => {
    try {
      const student = await Student.findById(req.params.id);
      if (!student) return res.status(404).json({ error: 'الطالب غير موجود' });
      student.active = true;
      await student.save();
      res.json(student);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  app.post('/api/students', authenticate(['admin', 'secretary']), async (req, res) => {
    try {
      const student = new Student(req.body);
      console.log(student) ;


      await student.save();
      res.status(201).json(student);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
    
  });

  app.get('/api/students/:id', /* authenticate(['admin', 'secretary', 'accountant']),*/ async (req, res) => {
    try {
      const student = await Student.findById(req.params.id)
        .populate('classes');
      if (!student) return res.status(404).json({ error: 'الطالب غير موجود' });
      res.json(student);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/students/:id', authenticate(['admin', 'secretary']), async (req, res) => {
    try {
      const student = await Student.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      res.json(student);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/students/:id', authenticate(['admin']), async (req, res) => {
    try {
      // Remove student from classes first
      await Class.updateMany(
        { students: req.params.id },
        { $pull: { students: req.params.id } }
      );

      // Delete associated payments, cards and attendances
      await Payment.deleteMany({ student: req.params.id });
      await Card.deleteMany({ student: req.params.id });
      await Attendance.deleteMany({ student: req.params.id });

      // Finally delete the student
      await Student.findByIdAndDelete(req.params.id);

      res.json({ message: 'تم حذف الطالب بنجاح' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Teachers
  app.get('/api/teachers', authenticate(['admin', 'secretary']), async (req, res) => {
    try {
      const teachers = await Teacher.find().sort({ name: 1 });
      res.json(teachers);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/teachers', authenticate(['admin']), async (req, res) => {
    try {
      const teacher = new Teacher(req.body);
      await teacher.save();
      res.status(201).json(teacher);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/teachers/:id', authenticate(['admin', 'secretary']), async (req, res) => {
    try {
      const teacher = await Teacher.findById(req.params.id);
      if (!teacher) return res.status(404).json({ error: 'الأستاذ غير موجود' });
      res.json(teacher);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/teachers/:id', authenticate(['admin']), async (req, res) => {
    try {
      const teacher = await Teacher.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      res.json(teacher);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/teachers/:id', authenticate(['admin']), async (req, res) => {
    try {
      // Remove teacher from classes first
      await Class.updateMany(
        { teacher: req.params.id },
        { $unset: { teacher: "" } }
      );

      // Delete the teacher
      await Teacher.findByIdAndDelete(req.params.id);

      res.json({ message: 'تم حذف الأستاذ بنجاح' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Classrooms
  app.get('/api/classrooms', authenticate(['admin', 'secretary']), async (req, res) => {
    try {
      const classrooms = await Classroom.find().sort({ name: 1 });
      res.json(classrooms);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/classrooms', authenticate(['admin']), async (req, res) => {
    try {
      const classroom = new Classroom(req.body);
      await classroom.save();
      res.status(201).json(classroom);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Classes
  app.get('/api/classes', authenticate(['admin', 'secretary', 'teacher']), async (req, res) => {
    try {
      const { academicYear, subject, teacher } = req.query;
      const query = {};

      if (academicYear) query.academicYear = academicYear;
      if (subject) query.subject = subject;
      if (teacher) query.teacher = teacher;

      const classes = await Class.find(query)
        .populate('teacher')
        .populate('students')
        .populate('schedule.classroom');
      res.json(classes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/classes', authenticate(['admin', 'secretary']), async (req, res) => {
    try {
      const classObj = new Class(req.body);
      await classObj.save();
      res.status(201).json(classObj);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/classes/:id', authenticate(['admin', 'secretary', 'teacher']), async (req, res) => {
    try {
      const classObj = await Class.findById(req.params.id)
        .populate('teacher')
        .populate('students')
        .populate('schedule.classroom');
      if (!classObj) return res.status(404).json({ error: 'الحصة غير موجودة' });
      res.json(classObj);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/classes/:id', authenticate(['admin', 'secretary']), async (req, res) => {
    try {
      const classObj = await Class.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      )
        .populate('teacher')
        .populate('students')
        .populate('schedule.classroom');

      res.json(classObj);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/classes/:id', authenticate(['admin']), async (req, res) => {
    try {
      // Remove class from students first
      await Student.updateMany(
        { classes: req.params.id },
        { $pull: { classes: req.params.id } }
      );

      // Delete associated payments and attendances
      await Payment.deleteMany({ class: req.params.id });
      await Attendance.deleteMany({ class: req.params.id });

      // Delete the class
      await Class.findByIdAndDelete(req.params.id);

      res.json({ message: 'تم حذف الحصة بنجاح' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Enroll Student in Class
  // Enroll Student in Class
  app.post('/api/classes/:classId/enroll/:studentId', authenticate(['admin', 'secretary']), async (req, res) => {
    try {
      // 1. Check if class and student exist
      const classObj = await Class.findById(req.params.classId);
      const student = await Student.findById(req.params.studentId);

      if (!classObj || !student) {
          return res.status(404).json({ error: 'الحصة أو الطالب غير موجود' });
      }

      // 2. Modified condition to allow enrollment in classes with no academic year
      const isAcademicYearMatch = (
          !classObj.academicYear || 
          classObj.academicYear === 'NS' || 
          classObj.academicYear === 'غير محدد' ||
          classObj.academicYear === student.academicYear
      );

      if (!isAcademicYearMatch) {
          return res.status(400).json({ 
              error: `لا يمكن تسجيل الطالب في هذه الحصة بسبب عدم تطابق السنة الدراسية (الحصة: ${classObj.academicYear}, الطالب: ${student.academicYear})`
          });
      }


      // 2. Add student to class if not already enrolled

      const isEnrolled = classObj.students.includes(req.params.studentId);
      if (isEnrolled) {
        return res.status(400).json({ error: 'الطالب مسجل بالفعل في هذه الحصة' });
      }

      if (!classObj.students.includes(req.params.studentId)) {
        classObj.students.push(req.params.studentId);
        await classObj.save();
      }

      if (!student.classes.includes(req.params.classId)) {
        student.classes.push(req.params.classId);
        await student.save();
      }

      // 4. Create monthly payments for student starting from enrollment date (now)
      const enrollmentDate = new Date(); // Use current date as enrollment date
      const currentDate = moment();
      const endDate = currentDate.clone().add(1, 'year');

      const months = [];
      let currentDateIter = moment(enrollmentDate); // Start from enrollment date

      while (currentDateIter.isBefore(endDate)) {
        months.push(currentDateIter.format('YYYY-MM'));
        currentDateIter.add(1, 'month');
      }

      const createdPayments = [];
      for (const month of months) {
        const paymentExists = await Payment.findOne({
          student: req.params.studentId,
          class: req.params.classId,
          month
        });

        if (!paymentExists) {
          const payment = new Payment({
            student: req.params.studentId,
            class: req.params.classId,
            amount: classObj.price,
            month,
            status: moment(month).isBefore(currentDate, 'month') ? 'late' : 'pending',
            recordedBy: req.user.id
          });

          await payment.save();
          createdPayments.push(payment);

          // Record financial transaction (expected income)
          const transaction = new FinancialTransaction({
            type: 'income',
            amount: classObj.price,
            description: `دفعة شهرية متوقعة لطالب ${student.name} في حصة ${classObj.name} لشهر ${month}`,
            category: 'tuition',
            recordedBy: req.user.id,
            reference: payment._id
          });
          await transaction.save();
        }
      }

      res.json({
        message: `تم إضافة الطالب ${student.name} للحصة ${classObj.name} بنجاح`,
        class: classObj,
        payments: await Payment.find({
          student: req.params.studentId,
          class: req.params.classId
        }).sort({ month: 1 })
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Unenroll Student from Class
  app.delete('/api/classes/:classId/unenroll/:studentId', authenticate(['admin', 'secretary']), async (req, res) => {
    try {
      // Remove student from class
      await Class.findByIdAndUpdate(
        req.params.classId,
        { $pull: { students: req.params.studentId } }
      );

      // Remove class from student
      await Student.findByIdAndUpdate(
        req.params.studentId,
        { $pull: { classes: req.params.classId } }
      );

      // Delete associated payments
      await Payment.deleteMany({
        student: req.params.studentId,
        class: req.params.classId,
        status: { $in: ['pending', 'late'] }
      });

      res.json({ message: 'تم إزالة الطالب من الحصة بنجاح' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Attendance
  app.get('/api/attendance', authenticate(['admin', 'secretary', 'teacher']), async (req, res) => {
    try {
      const { class: classId, student, date } = req.query;
      const query = {};

      if (classId) query.class = classId;
      if (student) query.student = student;
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        query.date = { $gte: startDate, $lt: endDate };
      }

      const attendance = await Attendance.find(query)
        .populate('student')
        .populate('class')
        .populate('recordedBy');
      res.json(attendance);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/attendance', authenticate(['admin', 'secretary', 'teacher']), async (req, res) => {
    try {
      const attendance = new Attendance({
        ...req.body,
        recordedBy: req.user.id
      });
      await attendance.save();
      res.status(201).json(attendance);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Cards
  app.get('/api/cards', authenticate(['admin', 'secretary']), async (req, res) => {
    try {
      const cards = await Card.find().populate('student');
      res.json(cards);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/cards', authenticate(['admin', 'secretary']), async (req, res) => {
    try {
      // Check if card already exists
      const existingCard = await Card.findOne({ uid: req.body.uid });
      if (existingCard) {
        return res.status(400).json({ error: 'البطاقة مسجلة بالفعل لطالب آخر' });
      }

      const card = new Card(req.body);
      await card.save();
      res.status(201).json(card);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/cards/:id', authenticate(['admin']), async (req, res) => {
    try {
      await Card.findByIdAndDelete(req.params.id);
      res.json({ message: 'تم حذف البطاقة بنجاح' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Payments
  app.get('/api/payments', authenticate(['admin', 'secretary', 'accountant']), async (req, res) => {
    try {
      const { student, class: classId, month, status } = req.query;
      const query = {};

      if (student) query.student = student;
      if (classId) query.class = classId;
      if (month) query.month = month;
      if (status) query.status = status;

      const payments = await Payment.find(query)
        .populate('student')
        .populate('class')
        .populate('recordedBy')
        .sort({ month: 1 });
      res.json(payments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Register Payment
  // Register Payment - FIXED VERSION
  app.put('/api/payments/:id/pay', authenticate(['admin', 'secretary', 'accountant']), async (req, res) => {
    console.log(req.params.id);
    console.log(req.body);
    try {
      const payment = await Payment.findById(req.params.id)
        .populate('student')
        .populate('class')
        .populate('recordedBy');

      if (!payment) {
        return res.status(404).json({ error: 'الدفعة غير موجودة' });
      }

      payment.status = 'paid';
      payment.paymentDate = req.body.paymentDate || new Date();
      payment.paymentMethod = req.body.paymentMethod || 'cash';
      payment.recordedBy = req.user.id; // Now this will work because req.user exists
      payment.invoiceNumber = `INV-${Date.now()}`;

      await payment.save();

      // Record financial transaction (actual income)
      const transaction = new FinancialTransaction({
        type: 'income',
        amount: payment.amount,
        description: `دفعة شهرية لطالب ${payment.student.name} في حصة ${payment.class.name} لشهر ${payment.month}`,
        category: 'tuition',
        recordedBy: req.user.id,
        reference: payment._id
      });
      await transaction.save();

      // Calculate teacher's share (70%)
      const teacherShare = payment.amount * 0.7;
      const teacherTransaction = new FinancialTransaction({
        type: 'expense',
        amount: teacherShare,
        description: `حصة الأستاذ من دفعة طالب ${payment.student.name} في حصة ${payment.class.name}`,
        category: 'salary',
        recordedBy: req.user.id,
        reference: payment._id
      });
      await teacherTransaction.save();

      // Send payment confirmation to parent
      // const smsContent = `تم تسديد دفعة شهر ${payment.month} بمبلغ ${payment.amount} د.ك لحصة ${payment.class.name}. رقم الفاتورة: ${payment.invoiceNumber}`;

      // try {
      //   // await smsGateway.send(payment.student.parentPhone, smsContent);
      //   await Message.create({
      //     sender: req.user.id,
      //     recipients: [{ student: payment.student._id, parentPhone: payment.student.parentPhone }],
      //     class: payment.class._id,
      //     content: smsContent,
      //     messageType: 'payment'
      //   });
      // } catch (smsErr) {
      //   console.error('فشل إرسال الرسالة:', smsErr);
      // }

      res.json({
        message: `تم تسديد الدفعة بنجاح`,
        payment,
        invoiceNumber: payment.invoiceNumber
      });
    } catch (err) {
      console.error('Payment registration error:', err);
      res.status(500).json({ error: err.message });
    }
  });
  // Generate Invoice
  app.get('/api/payments/:id', authenticate(['admin', 'secretary', 'accountant']), async (req, res) => {
      try {
          const payment = await Payment.findById(req.params.id)
              .populate('student')
              .populate('class')
              .populate('recordedBy');

          if (!payment) {
              return res.status(404).json({ error: 'الدفعة غير موجودة' });
          }

          res.json(payment);
      } catch (err) {
          res.status(500).json({ error: err.message });
      }
  });
  // Messages
  app.get('/api/messages', authenticate(['admin', 'secretary']), async (req, res) => {
    try {
      const { messageType, class: classId, startDate, endDate } = req.query;
      const query = {};

      if (messageType) query.messageType = messageType;
      if (classId) query.class = classId;
      if (startDate || endDate) {
        query.sentAt = {};
        if (startDate) query.sentAt.$gte = new Date(startDate);
        if (endDate) query.sentAt.$lte = new Date(endDate);
      }

      const messages = await Message.find(query)
        .populate('sender')
        .populate('class')
        .populate('recipients.student')
        .sort({ sentAt: -1 });
      res.json(messages);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/messages', authenticate(['admin', 'secretary']), async (req, res) => {
    try {
      const { recipients, content, messageType, class: classId } = req.body;

      // Validate recipients based on message type
      let validatedRecipients = [];

      if (messageType === 'individual' && recipients.student) {
        const student = await Student.findById(recipients.student);
        if (!student) {
          return res.status(400).json({ error: 'الطالب غير موجود' });
        }
        validatedRecipients.push({
          student: student._id,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail
        });
      }
      else if (messageType === 'class' && classId) {
        const classObj = await Class.findById(classId).populate('students');
        if (!classObj) {
          return res.status(400).json({ error: 'الحصة غير موجودة' });
        }
        validatedRecipients = classObj.students.map(student => ({
          student: student._id,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail
        }));
      }
      else if (messageType === 'group' && recipients.length) {
        for (const recipient of recipients) {
          const student = await Student.findById(recipient.student);
          if (student) {
            validatedRecipients.push({
              student: student._id,
              parentPhone: student.parentPhone,
              parentEmail: student.parentEmail
            });
          }
        }
      }
      else if (messageType === 'payment') {
        // This is handled in the payment route
        return res.status(400).json({ error: 'يجب استخدام طريق الدفع لإرسال رسائل الدفع' });
      }

      if (!validatedRecipients.length) {
        return res.status(400).json({ error: 'لا يوجد مستلمين للرسالة' });
      }

      // Send messages
      const failedRecipients = [];

      for (const recipient of validatedRecipients) {
        try {
          if (recipient.parentPhone) {
            await smsGateway.send(recipient.parentPhone, content);
          }
          if (recipient.parentEmail) {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: recipient.parentEmail,
              subject: 'رسالة من المدرسة',
              text: content
            });
          }
        } catch (err) {
          console.error(`فشل إرسال الرسالة لـ ${recipient.parentPhone || recipient.parentEmail}`, err);
          failedRecipients.push(recipient);
        }
      }

      // Save message record
      const message = new Message({
        sender: req.user.id,
        recipients: validatedRecipients,
        class: classId,
        content,
        messageType,
        status: failedRecipients.length ? 'failed' : 'sent'
      });
      await message.save();

      if (failedRecipients.length) {
        return res.status(207).json({
          message: 'تم إرسال بعض الرسائل وفشل البعض الآخر',
          failedRecipients,
          messageId: message._id
        });
      }

      res.status(201).json({
        message: 'تم إرسال جميع الرسائل بنجاح',
        messageId: message._id
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Financial Transactions
  app.get('/api/transactions', authenticate(['admin', 'accountant']), async (req, res) => {
    try {
      const { type, category, startDate, endDate } = req.query;
      const query = {};

      if (type) query.type = type;
      if (category) query.category = category;
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const transactions = await FinancialTransaction.find(query)
        .populate('recordedBy')
        .sort({ date: -1 });
      res.json(transactions);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Financial Reports
  app.get('/api/reports/financial', authenticate(['admin', 'accountant']), async (req, res) => {
    try {
      const { year } = req.query;
      const matchStage = {};

      if (year) {
        matchStage.date = {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        };
      }

      const report = await FinancialTransaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              type: '$type',
              category: '$category',
              month: { $month: '$date' },
              year: { $year: '$date' }
            },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: {
              type: '$_id.type',
              category: '$_id.category'
            },
            monthlyData: {
              $push: {
                month: '$_id.month',
                year: '$_id.year',
                totalAmount: '$totalAmount',
                count: '$count'
              }
            },
            totalAmount: { $sum: '$totalAmount' },
            totalCount: { $sum: '$count' }
          }
        },
        {
          $project: {
            type: '$_id.type',
            category: '$_id.category',
            monthlyData: 1,
            totalAmount: 1,
            totalCount: 1,
            _id: 0
          }
        }
      ]);

      res.json(report);
    } catch (err) {
      res.status(500).json({ error: err.message });

    }
  });





  // Live Classes Routes
  app.get('/api/live-classes', authenticate(['admin', 'secretary', 'teacher']), async (req, res) => {
    try {
      const { status, date, class: classId } = req.query;
      const query = {};

      if (status) query.status = status;
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        query.date = { $gte: startDate, $lt: endDate };
      }
      if (classId) query.class = classId;

      const liveClasses = await LiveClass.find(query)
        .populate('class')
        .populate('teacher')
        .populate('classroom')
        .populate('attendance.student')
        .sort({ date: -1, startTime: -1 });
      
      res.json(liveClasses);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/live-classes', authenticate(['admin', 'secretary', 'teacher']), async (req, res) => {
    try {
      const liveClass = new LiveClass({
        ...req.body,
        createdBy: req.user.id
      });
      
      await liveClass.save();
      
      // Populate the saved data for response
      const populated = await LiveClass.findById(liveClass._id)
        .populate('class')
        .populate('teacher')
        .populate('classroom');
      
      res.status(201).json(populated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/live-classes/:id', authenticate(['admin', 'secretary', 'teacher']), async (req, res) => {
    try {
      const liveClass = await LiveClass.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      )
        .populate('class')
        .populate('teacher')
        .populate('classroom')
        .populate('attendance.student');
      
      res.json(liveClass);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/live-classes/:id', authenticate(['admin', 'secretary', 'teacher']), async (req, res) => {
    try {
      const liveClass = await LiveClass.findById(req.params.id)
        .populate('class')
        .populate('teacher')
        .populate('classroom')
        .populate('attendance.student');
      
      if (!liveClass) return res.status(404).json({ error: 'الحصة غير موجودة' });
      
      res.json(liveClass);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Enhanced attendance endpoint
  app.post('/api/live-classes/:id/attendance', authenticate(['admin', 'secretary', 'teacher']), async (req, res) => {
    try {
      const { studentId, status, method } = req.body; // Added method parameter
      
      const liveClass = await LiveClass.findById(req.params.id)
        .populate('class')
        .populate('teacher');
        
      if (!liveClass) return res.status(404).json({ error: 'الحصة غير موجودة' });
      
      // Get student (either by ID or card UID)
      let student;
      if (method === 'rfid') {
        const card = await Card.findOne({ uid: studentId }).populate('student');
        if (!card) return res.status(404).json({ error: 'البطاقة غير مسجلة' });
        student = card.student;
      } else {
        student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ error: 'الطالب غير موجود' });
      }

      // Check if student is enrolled in this class
      const isEnrolled = liveClass.class.students.some(s => s.equals(student._id));
      if (!isEnrolled) {
        return res.status(400).json({ error: 'الطالب غير مسجل في هذه الحصة' });
      }

      // Update attendance
      const existingIndex = liveClass.attendance.findIndex(a => 
        a.student.equals(student._id)
      );
      
      const attendanceRecord = {
        student: student._id,
        status,
        method: method || 'manual', // Track how attendance was recorded
        timestamp: new Date()
      };

      if (existingIndex >= 0) {
        liveClass.attendance[existingIndex] = attendanceRecord;
      } else {
        liveClass.attendance.push(attendanceRecord);
      }

      await liveClass.save();

      // Send notification if via RFID
      if (method === 'rfid' && student.parentPhone) {
        const smsContent = `تم تسجيل حضور الطالب ${student.name} في حصة ${liveClass.class.name} في ${new Date().toLocaleString('ar-EG')}`;
        try {
          await smsGateway.send(student.parentPhone, smsContent);
        } catch (smsErr) {
          console.error('Failed to send SMS:', smsErr);
        }
      }

      res.json({
        message: 'تم تسجيل الحضور بنجاح',
        attendance: attendanceRecord,
        student
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get('/api/live-classes/:classId/report', authenticate(['admin', 'secretary', 'teacher']), async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;
      
      const query = { class: req.params.classId };
      if (fromDate && toDate) {
        query.date = { 
          $gte: new Date(fromDate),
          $lte: new Date(toDate)
        };
      }
      
      const liveClasses = await LiveClass.find(query)
        .populate('attendance.student')
        .sort({ date: 1 });
      
      // Create attendance report
      const report = {
        class: req.params.classId,
        totalClasses: liveClasses.length,
        attendance: {}
      };
      
      // Initialize attendance for all students
      const classObj = await Class.findById(req.params.classId).populate('students');
      classObj.students.forEach(student => {
        report.attendance[student._id] = {
          student: student,
          present: 0,
          absent: 0,
          late: 0,
          total: 0
        };
      });
      
      // Calculate attendance for each student
      liveClasses.forEach(liveClass => {
        liveClass.attendance.forEach(att => {
          if (report.attendance[att.student]) {
            report.attendance[att.student][att.status]++;
            report.attendance[att.student].total++;
          }
        });
      });
      
      res.json(report);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });





  // Student Registration Endpoint
  app.post('/api/student/register', async (req, res) => {
    try {
      console.log('Received registration data:', req.body); // Debug log

      // تحقق من الحقول المطلوبة
      const requiredFields = ['name', 'academicYear', 'parentName', 'parentPhone'];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({ 
            error: `حقل ${field} مطلوب` 
          });
        }
      }

      // أنشئ سجل الطالب
      const student = new Student({
        name: req.body.name,
        academicYear: req.body.academicYear,
        parentName: req.body.parentName,
        parentPhone: req.body.parentPhone,
        birthDate: req.body.birthDate,
        parentEmail: req.body.parentEmail,
        address: req.body.address,
        previousSchool: req.body.previousSchool,
        healthInfo: req.body.healthInfo,
        status: 'pending',
        active: false,
        registrationDate: new Date()
      });

      // احفظ في قاعدة البيانات
      await student.save();

      console.log('Student registered successfully:', student); // Debug log

      res.status(201).json({
        message: 'تم استلام طلب التسجيل بنجاح',
        studentId: student._id
      });

    } catch (err) {
      console.error('Registration error:', err);
      
      // أرسل رسالة خطأ أكثر تفصيلاً
      res.status(500).json({ 
        error: 'حدث خطأ أثناء تسجيل الطلب',
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  });

  // Get Registration Requests (Admin only)
  app.get('/api/registration-requests', async (req, res) => {
    try {
      const { status } = req.query;
      const query = { status: status || 'pending' };
      
      const requests = await Student.find(query)
        .sort({ registrationDate: -1 });
      
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  // Approve Student
  app.put('/api/admin/approve-student/:id', authenticate(['admin']), async (req, res) => {
      try {
          // Generate official student ID
          const year = new Date().getFullYear().toString().slice(-2);
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          const studentId = `STU-${year}-${randomNum}`;

          const student = await Student.findByIdAndUpdate(
              req.params.id,
              {
                  status: 'active',
                  active: true,
                  studentId,
                  $unset: { 'registrationData.tempId': 1 }
              },
              { new: true }
          );

          // Send approval notification
          // const smsContent = `تم قبول طلب تسجيل الطالب ${student.name}. الرقم الجامعي: ${studentId}. يمكن الآن تسجيل الدخول باستخدام هذا الرقم.`;
          // await smsGateway.send(student.parentPhone, smsContent);
      io.to(`student-${student.studentId}`).emit('registration-update', {
        studentId: student.studentId,
        status: 'active',
        name: student.name,
        registrationDate: student.registrationDate
      });


          res.json({
              message: 'تم تفعيل حساب الطالب بنجاح',
              studentId: student.studentId
          });
      } catch (err) {
          res.status(500).json({ error: err.message });
      }
  });

  // Reject Student
  app.put('/api/admin/reject-student/:id', async (req, res) => {
      try {
          const { reason } = req.body;
          const student = await Student.findByIdAndUpdate(
              req.params.id,
              { status: 'inactive', active: false },
              { new: true }
          );

          // Send rejection notification
          // const smsContent = `نأسف لإعلامكم أن طلب تسجيل الطالب ${student.name} قد تم رفضه. السبب: ${reason || 'غير محدد'}.`;
          // await smsGateway.send(student.parentPhone, smsContent);
          io.to(`student-${student.studentId}`).emit('registration-update', {
            studentId: student.studentId,
            status: 'inactive',
            name: student.name,
            registrationDate: student.registrationDate,
            reason: req.body.reason
          });
          res.json({ message: 'تم رفض طلب التسجيل' });
      } catch (err) {
          res.status(500).json({ error: err.message });
      }
  });

  // Add this endpoint
  app.post('/api/student/status', async (req, res) => {
    try {
      const { studentId, parentPhone } = req.body;
      const student = await Student.findOne({ 
        studentId,
        parentPhone 
      });

      if (!student) {
        return res.status(404).json({ error: 'لم يتم العثور على الطالب' });
      }

      // Subscribe client to updates for this student
      const socketId = req.headers['socket-id'];
      if (socketId && io.sockets.sockets[socketId]) {
        io.sockets.sockets[socketId].join(`student-${studentId}`);
      }

      res.json({
        name: student.name,
        studentId: student.studentId,
        status: student.status,
        registrationDate: student.registrationDate,
        academicYear: student.academicYear
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });



  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('subscribe-to-status', (studentId) => {
      socket.join(`student-${studentId}`);
      console.log(`Client subscribed to student ${studentId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // create student account for ta3limi by user id 
  // req student id 

  // Add these routes to your backend (server.js or routes file)

  // Get all student accounts with filtering
// Get all student accounts with filtering
app.get('/api/student-accounts', async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = { role: 'student' };

    if (status) query.active = status === 'active';
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    const accounts = await StudentAccount.find(query)
      .select('-password')
      .populate('student', 'name studentId parentPhone parentEmail academicYear');

    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

  // Create student account
  app.post('/api/student-accounts', authenticate(['admin']), async (req, res) => {
    const { studentId, username, password, email } = req.body;

    try {
      // Validate required fields
      if (!studentId || !username || !password) {
        return res.status(400).json({ error: 'يجب إدخال جميع الحقول المطلوبة' });
      }

      // Check if student exists
      const student = await Student.findOne({ _id: studentId });
      if (!student) {
        return res.status(404).json({ error: 'الطالب غير موجود' });
      }

      // Check if account already exists
      const existingAccount = await StudentAccount.findOne({ 
        $or: [{ username }, { studentId: student.studentId }] 
      });
      
      if (existingAccount) {
        return res.status(400).json({ 
          error: 'اسم المستخدم أو حساب الطالب موجود بالفعل' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create account
      const newAccount = new StudentAccount({
        username,
        password: hashedPassword,
        fullName: student.name,
        studentId: student.studentId,
        student: student._id,
        email: email || student.parentEmail,
        role: 'student'
      });

      await newAccount.save();

      // Update student record to mark as having account
      student.hasAccount = true;
      await student.save();

      res.status(201).json({
        message: 'تم إنشاء حساب الطالب بنجاح',
        account: {
          _id: newAccount._id,
          username: newAccount.username,
          studentId: newAccount.studentId,
          studentName: student.name
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete student account
  app.delete('/api/student-accounts/:id', authenticate(['admin']), async (req, res) => {
    try {
      const account = await StudentAccount.findByIdAndDelete(req.params.id);
      
      if (!account) {
        return res.status(404).json({ error: 'الحساب غير موجود' });
      }

      // Update student record to mark as no account
      await Student.updateOne(
        { studentId: account.studentId },
        { $set: { hasAccount: false } }
      );

      res.json({ message: 'تم حذف الحساب بنجاح' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reset password
  app.put('/api/student-accounts/:id/reset-password', authenticate(['admin']), async (req, res) => {
    const { password } = req.body;

    try {
      if (!password) {
        return res.status(400).json({ error: 'يجب إدخال كلمة مرور جديدة' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const account = await StudentAccount.findByIdAndUpdate(
        req.params.id,
        { password: hashedPassword },
        { new: true }
      ).select('-password');

      if (!account) {
        return res.status(404).json({ error: 'الحساب غير موجود' });
      }

      res.json({ 
        message: 'تم تحديث كلمة المرور بنجاح',
        account
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Toggle account status (active/inactive)
  app.put('/api/student-accounts/:id/toggle-status', authenticate(['admin']), async (req, res) => {
    try {
      const account = await StudentAccount.findById(req.params.id);
      
      if (!account) {
        return res.status(404).json({ error: 'الحساب غير موجود' });
      }

      account.active = !account.active;
      await account.save();

      res.json({ 
        message: `تم ${account.active ? 'تفعيل' : 'تعطيل'} الحساب بنجاح`,
        account
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Student Login Route
  app.post('/api/student/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username, role: 'student' });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
      }

      const student = await Student.findOne({ studentId: user.studentId });

      if (!student) {
        return res.status(404).json({ error: 'الطالب غير موجود' });
      }

      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role, studentId: user.studentId },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({ 
        token, 
        user: { 
          username: user.username, 
          role: user.role, 
          fullName: user.fullName,
          studentId: user.studentId
        } 
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get Student Data
  app.get('/api/student/data', authenticate(['student']), async (req, res) => {
    try {
      const student = await Student.findOne({ studentId: req.user.studentId })
        .populate({
          path: 'classes',
          populate: [
            { path: 'teacher', model: 'Teacher' },
            { path: 'schedule.classroom', model: 'Classroom' }
          ]
        });

      if (!student) {
        return res.status(404).json({ error: 'الطالب غير موجود' });
      }

      // Get upcoming classes (next 7 days)
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const upcomingClasses = [];
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      
      student.classes.forEach(cls => {
        cls.schedule.forEach(session => {
          const dayIndex = days.indexOf(session.day);
          if (dayIndex >= 0) {
            const classDate = new Date(today);
            const daysToAdd = (dayIndex - today.getDay() + 7) % 7;
            classDate.setDate(today.getDate() + daysToAdd);
            
            if (classDate >= today && classDate <= nextWeek) {
              const [hours, minutes] = session.time.split(':').map(Number);
              classDate.setHours(hours, minutes, 0, 0);
              
              upcomingClasses.push({
                classId: cls._id,
                className: cls.name,
                subject: cls.subject,
                teacher: cls.teacher.name,
                day: session.day,
                time: session.time,
                classroom: session.classroom?.name || 'غير محدد',
                date: classDate,
                formattedDate: classDate.toLocaleDateString('ar-EG')
              });
            }
          }
        });
      });

      // Sort by date
      upcomingClasses.sort((a, b) => a.date - b.date);

      // Get payment status
      const payments = await Payment.find({ 
        student: student._id 
      }).populate('class').sort({ month: -1 });

      res.json({
        student: {
          name: student.name,
          studentId: student.studentId,
          academicYear: student.academicYear,
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail
        },
        upcomingClasses,
        payments
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Student Change Password
  app.post('/api/student/change-password', authenticate(['student']), async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);

      if (!(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  app.get('/student/status/:studentId', async (req, res) => {
    try {
      const student = await Student.findOne({ studentId: req.params.studentId });
      if (!student) {
        return res.status(404).json({ error: 'الطالب غير موجود' });
      }
      res.json({
        status: student.status,
        active: student.active,
        name: student.name,
        registrationDate: student.registrationDate
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  initializeRFIDReader();

  // Main application entry point
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });


  // Admin dashboard
  app.get('/admin', authenticate(['admin']), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  });

  // Teacher dashboard
  app.get('/teacher', authenticate(['teacher']), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
  });

  // Student routes
  app.get('/student', (req, res) => {
    res.redirect('/student/login');
  });

  app.get('/student/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student-register.html'));
  });

  app.get('/student/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student-login.html'));
  });

  app.get('/student/dashboard', authenticate(['student']), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student-dashboard.html'));
  });

  const PORT = process.env.PORT || 4200;
  server.listen(PORT, () => {
    console.log(` server is working on : http://localhost:${PORT}`);
  });

  process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
  });

  process.on('uncaughtException', (err, origin) => {
    console.error('Uncaught Exception at:', origin, 'error:', err);
    // application specific logging, throwing an error, or other logic here
  });

  process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error('Uncaught Exception Monitor at:', origin, 'error:', err);
    // application specific logging, throwing an error, or other logic here
  });

  process.on('unhandledRejectionMonitor', (reason, p) => {
    console.error('Unhandled Rejection Monitor at:', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
  });

  process.on('warning', (warning) => {
    console.error('Warning:', warning);
    // application specific logging, throwing an error, or other logic here
  });