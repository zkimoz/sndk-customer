import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import {
  Settings, Search, ShieldCheck, PackageSearch, Sparkles, Car, Cog, Droplets,
  CheckCircle2, Loader2, Globe, Bell, Home, Plus, Phone,
  Menu, X, ChevronLeft, ChevronRight, User, Calendar,
  Wrench, ArrowRight, Lock, LogOut, MapPin, Mail,
  ClipboardList, Package, ShoppingCart, Trash2, Upload, FileImage, Pencil, Check,
  Sun, Moon,
} from 'lucide-react';

// ── Translations ───────────────────────────────────────────────────────
const T = {
  ar: {
    appName:'سندك', tagline:'خدمة VIP لسيارتك',
    ourServices:'خدماتنا',
    steps:['الخدمة','بياناتك','الموعد','التأكيد'],
    selectServiceSub:'اختر نوع الخدمة التي تحتاجها',
    yourDetails:'بياناتك والسيارة',
    fullName:'الاسم بالكامل', fullNamePh:'محمد أحمد',
    phone:'رقم الجوال', phoneHint:'8 أرقام',
    phoneError:'يجب أن يكون 8 أرقام بالضبط',
    carBrand:'نوع السيارة', selectBrand:'اختر النوع',
    carCategory:'الفئة', selectCategory:'اختر الفئة',
    carYear:'سنة الموديل', yearHint:'4 أرقام',
    pickTime:'اختر موعدك', date:'التاريخ', selectTime:'اختر وقتاً',
    notes:'شكاوى وملاحظات إضافية عن السيارة', notesPh:'اكتب أي عطل أو شكوى أو ملاحظة عن سيارتك...',
    reviewTitle:'مراجعة وتأكيد',
    customer:'العميل', car:'السيارة', service:'الخدمة', apptLabel:'الموعد',
    confirm:'تأكيد الحجز', confirming:'جاري الحجز...',
    edit:'تعديل',
    successTitle:'تم الحجز!', successMsg:'سنتواصل معك قريباً لتأكيد الموعد.',
    backHome:'حجز جديد',
    next:'التالي', back:'رجوع',
    errorMsg:'حدث خطأ، حاول مرة أخرى',
    navHome:'الرئيسية', navServices:'الخدمات', navContact:'تواصل', navMore:'المزيد', navProfile:'حسابي',
    bookNow:'احجز الآن',
    switchLang:'EN',
    greeting:'مرحباً بك في سندك', greetingSub:'خدمة سيارات VIP في قطر',
    signIn:'تسجيل الدخول', signUp:'إنشاء حساب', signOut:'تسجيل الخروج',
    email:'البريد الإلكتروني', emailPh:'example@email.com',
    password:'كلمة المرور', passwordPh:'كلمة مرور قوية',
    noAccount:'ليس لديك حساب؟', hasAccount:'لديك حساب بالفعل؟',
    confirmEmailMsg:'تم إرسال رابط التأكيد على بريدك الإلكتروني',
    myAccount:'حسابي', authError:'خطأ في البريد أو كلمة المرور',
    forgotPw:'نسيت كلمة المرور؟',
    forgotTitle:'استرجاع كلمة المرور',
    forgotByEmail:'عن طريق الإيميل',
    forgotByPhone:'عن طريق رقم الموبيل',
    forgotSend:'إرسال رابط الاسترجاع',
    forgotSent:'تم الإرسال!',
    forgotSentSub:'تحقق من إيميلك — رابط إعادة تعيين كلمة المرور وصلك.',
    forgotPhoneCheck:'تم التحقق من رقمك — أدخل الإيميل المسجل مع الحساب',
    forgotPhoneNotFound:'الرقم غير موجود. تحقق من الرقم أو تواصل مع الدعم.',
    forgotBack:'العودة لتسجيل الدخول',
    newPwTitle:'تعيين كلمة مرور جديدة',
    newPwLabel:'كلمة المرور الجديدة',
    newPwConfirm:'تأكيد كلمة المرور',
    newPwSave:'حفظ كلمة المرور',
    newPwDone:'تم تعيين كلمة المرور الجديدة بنجاح!',
    pwNoMatch:'كلمتا المرور غير متطابقتين',
    loggedAs:'مرحباً،',
    bookRequiresLogin:'يجب تسجيل الدخول أولاً للحجز',
    bookRequiresLoginSub:'أنشئ حسابك أو سجّل دخولك لتحجز خدمتك بسهولة',
    loginToBook:'سجّل دخولك للحجز',
    createAccountToBook:'أنشئ حساباً للحجز',
    // Services page
    allServices:'جميع الخدمات',
    subServices:'الخدمات الفرعية',
    bookService:'احجز هذه الخدمة',
    browseFreely:'تصفح بدون حساب',
    // Profile page
    myProfile:'ملف حسابي',
    myInfo:'بياناتي الشخصية',
    myCars:'سياراتي',
    myHistory:'تاريخ الصيانات',
    noCars:'لا توجد سيارات مرتبطة بحسابك بعد',
    noHistory:'لا توجد صيانات مسجلة لهذه السيارة',
    profileZone:'المنطقة', profileStreet:'الشارع', profileBuilding:'المبنى',
    historyDoneAtSndk:'عند سندك', historyExternal:'ورشة خارجية',
    historyStatus:'الحالة', historyDate:'التاريخ', historyService:'الخدمة',
    carVin:'الشاصي', carPlate:'اللوحة', carModel:'الموديل',
    apptPending:'قيد الانتظار', apptConfirmed:'مؤكد', apptInProgress:'في الورشة',
    apptCompleted:'مكتمل', apptCancelled:'ملغي',
    apptCancelBtn:'إلغاء الموعد', apptCancelConfirm:'هل تريد إلغاء هذا الموعد؟ لا يمكن التراجع.',
    apptCancelledBy:'تم الإلغاء',
    // Profile edit
    prof_edit:'تعديل بياناتي', prof_save:'حفظ التغييرات', prof_cancel:'إلغاء',
    prof_name:'الاسم الكامل', prof_phone:'رقم الجوال',
    prof_addr:'العنوان (اختياري)', prof_zone:'رقم المنطقة (Zone)',
    prof_street:'رقم الشارع', prof_building:'رقم المبنى',
    prof_save_ok:'✅ تم حفظ بياناتك',
    // Add car
    prof_add_car:'إضافة سيارة',
    prof_car_type:'نوع السيارة (الماركة)', prof_car_type_ph:'مثال: تويوتا، نيسان...',
    prof_car_cat:'الفئة', prof_car_cat_ph:'سيدان، SUV، بيك أب...',
    prof_car_year:'سنة الموديل', prof_car_year_ph:'2020',
    prof_plate:'رقم اللوحة', prof_plate_ph:'ادخل رقم لوحة السيارة',
    prof_chassis:'رقم الشاصيه', prof_chassis_ph:'ادخل رقم الشاصية للسيارة',
    prof_registration:'صورة الاستمارة (اختياري)',
    prof_reg_upload:'اضغط لرفع صورة الاستمارة', prof_reg_view:'عرض الاستمارة',
    prof_add_car_btn:'إضافة السيارة', prof_add_car_ok:'✅ تمت إضافة السيارة',
    prof_edit_car:'تعديل بيانات السيارة', prof_save_car:'حفظ التعديلات', prof_cancel_edit:'إلغاء',
    // Booking – car step (logged-in)
    yourCar:'اختر سيارتك', selectYear:'اختر السنة',
    changeCar:'تغيير', addCarNew:'إضافة سيارة جديدة',
    backToCars:'العودة لسياراتي', loadingCars:'جاري تحميل سياراتك...',
    noCarsYet:'لا توجد سيارات — أضف سيارتك للمتابعة',
    // My Orders page
    navOrders:'طلباتي',
    myOrders:'طلباتي',
    ordAppts:'المواعيد',
    ordParts:'طلبات القطع',
    ordNoAppts:'لا توجد مواعيد مسجلة بعد',
    ordNoParts:'لا توجد طلبات قطع غيار بعد',
    ordSignIn:'سجّل دخولك لعرض حجوزاتك وطلباتك',
    ordTotal:'الإجمالي',
    ordStDraft:'مسودة',
    ordStPending:'قيد المراجعة',
    ordStSourcing:'جاري التوفير',
    ordStReady:'جاهز',
    ordStDelivered:'تم التسليم',
    ordStCancelled:'ملغي',
    ordLoading:'جاري تحميل طلباتك...',
    ordQar:'ر.ق',
    // Cart
    cartAdd:'+ أضف',
    cartAdded:'✓ مضاف',
    cartBook:'احجز الكل',
    cartCount:'خدمات في السلة',
    cartEmpty:'اختر خدمة للبدء',
    cartServices:'خدمة مختارة',
    ordPayReq:'ادفع الآن',
    ordPayPending:'بانتظار التأكيد ⏳',
    ordPaid:'تم الدفع ✓',
    ordPartsLabel:'قطع الغيار',
    ordLaborLabel:'مصنعيات / شغل اليد',
    ordPayParts:'ادفع القطع',
    ordPayLabor:'ادفع المصنعيات',
    ordPayLaborHint:'متاح بعد دفع القطع واكتمال الطلب',
    // Quotation approval
    quotPending:'عرض سعر بانتظار موافقتك',
    quotApproveBtn:'موافق على عرض السعر',
    quotApproveConfirm:'هل توافق على عرض السعر؟ بعد الموافقة سيبدأ فريقنا في استيراد القطع والعمل.',
    quotApproved:'✅ تمت الموافقة على عرض السعر',
    quotApprovedLabel:'تمت الموافقة',
    quotTotal:'إجمالي عرض السعر',
    // Job card statuses
    jc_waiting:'قيد الانتظار',
    jc_confirmed:'تم تأكيد الموعد',
    jc_en_route:'فريقنا في الطريق إليك',
    jc_car_received:'تم استلام السيارة',
    jc_at_workshop:'وصلت السيارة للورشة',
    jc_in_maintenance:'السيارة تحت الصيانة',
    jc_maintenance_done:'تم الانتهاء من أعمال الصيانة',
    jc_washing:'السيارة في الغسيل',
    jc_awaiting_invoice:'في انتظار إصدار الفاتورة',
    jc_returning:'السيارة في طريقها للعودة',
    jc_delivered:'تم تسليم السيارة',
    jc_number:'أمر الشغل',
  },
  en: {
    appName:'SNDK', tagline:'Your VIP Car Service',
    ourServices:'Our Services',
    steps:['Service','Details','Schedule','Confirm'],
    selectServiceSub:'Choose the type of service you need',
    yourDetails:'Your Details & Car',
    fullName:'Full Name', fullNamePh:'John Smith',
    phone:'Phone Number', phoneHint:'8 digits',
    phoneError:'Must be exactly 8 digits',
    carBrand:'Car Brand', selectBrand:'Select Brand',
    carCategory:'Category', selectCategory:'Select Category',
    carYear:'Model Year', yearHint:'4 digits',
    pickTime:'Choose Appointment', date:'Date', selectTime:'Select a Time',
    notes:'Complaints & Additional Notes About the Car', notesPh:'Describe any issue, complaint, or note about your car...',
    reviewTitle:'Review & Confirm',
    customer:'Customer', car:'Car', service:'Service', apptLabel:'Appointment',
    confirm:'Confirm Booking', confirming:'Booking...',
    edit:'Edit',
    successTitle:'Booking Confirmed!', successMsg:'We will contact you soon to confirm your appointment.',
    backHome:'New Booking',
    next:'Next', back:'Back',
    errorMsg:'An error occurred, please try again',
    navHome:'Home', navServices:'Services', navContact:'Contact', navMore:'More', navProfile:'My Account',
    bookNow:'Book Now',
    switchLang:'عربي',
    greeting:'Welcome to SNDK', greetingSub:"Qatar's VIP Car Service",
    signIn:'Sign In', signUp:'Sign Up', signOut:'Sign Out',
    email:'Email', emailPh:'example@email.com',
    password:'Password', passwordPh:'Strong password',
    noAccount:"Don't have an account?", hasAccount:'Already have an account?',
    confirmEmailMsg:'Check your email to activate your account',
    myAccount:'My Account', authError:'Invalid email or password',
    forgotPw:'Forgot password?',
    forgotTitle:'Reset Password',
    forgotByEmail:'Via Email',
    forgotByPhone:'Via Phone Number',
    forgotSend:'Send Reset Link',
    forgotSent:'Sent!',
    forgotSentSub:'Check your inbox — a password reset link has been sent.',
    forgotPhoneCheck:'Phone verified — enter the email linked to this account',
    forgotPhoneNotFound:'Number not found. Check the number or contact support.',
    forgotBack:'Back to Sign In',
    newPwTitle:'Set New Password',
    newPwLabel:'New Password',
    newPwConfirm:'Confirm Password',
    newPwSave:'Save Password',
    newPwDone:'Password updated successfully!',
    pwNoMatch:'Passwords do not match',
    loggedAs:'Welcome,',
    bookRequiresLogin:'Sign in to book your appointment',
    bookRequiresLoginSub:'Create an account or sign in to easily book your service',
    loginToBook:'Sign In to Book',
    createAccountToBook:'Create Account to Book',
    allServices:'All Services',
    subServices:'Sub Services',
    bookService:'Book This Service',
    browseFreely:'Browse without account',
    myProfile:'My Profile',
    myInfo:'Personal Info',
    myCars:'My Cars',
    myHistory:'Maintenance History',
    noCars:'No cars linked to your account yet',
    noHistory:'No maintenance records for this car',
    profileZone:'Zone', profileStreet:'Street', profileBuilding:'Building',
    historyDoneAtSndk:'At SNDK', historyExternal:'External Workshop',
    historyStatus:'Status', historyDate:'Date', historyService:'Service',
    carVin:'VIN', carPlate:'Plate', carModel:'Model',
    apptPending:'Pending', apptConfirmed:'Confirmed', apptInProgress:'In Progress',
    apptCompleted:'Completed', apptCancelled:'Cancelled',
    apptCancelBtn:'Cancel Appointment', apptCancelConfirm:'Cancel this appointment? This cannot be undone.',
    apptCancelledBy:'Cancelled',
    // Profile edit
    prof_edit:'Edit My Profile', prof_save:'Save Changes', prof_cancel:'Cancel',
    prof_name:'Full Name', prof_phone:'Phone Number',
    prof_addr:'Address (Optional)', prof_zone:'Zone Number',
    prof_street:'Street Number', prof_building:'Building Number',
    prof_save_ok:'✅ Profile saved',
    // Add car
    prof_add_car:'Add Car',
    prof_car_type:'Car Type (Brand)', prof_car_type_ph:'e.g. Toyota, Nissan...',
    prof_car_cat:'Category', prof_car_cat_ph:'Sedan, SUV, Pickup...',
    prof_car_year:'Model Year', prof_car_year_ph:'2020',
    prof_plate:'Plate Number', prof_plate_ph:'Enter plate number',
    prof_chassis:'Chassis Number', prof_chassis_ph:'Enter chassis number',
    prof_registration:'Registration Card (optional)',
    prof_reg_upload:'Tap to upload registration card', prof_reg_view:'View Registration',
    prof_add_car_btn:'Add Car', prof_add_car_ok:'✅ Car added',
    prof_edit_car:'Edit Car Details', prof_save_car:'Save Changes', prof_cancel_edit:'Cancel',
    // Booking – car step (logged-in)
    yourCar:'Select Your Car', selectYear:'Select Year',
    changeCar:'Change', addCarNew:'Add New Car',
    backToCars:'Back to My Cars', loadingCars:'Loading your cars...',
    noCarsYet:'No cars yet — add your car to continue',
    // My Orders page
    navOrders:'My Orders',
    myOrders:'My Orders',
    ordAppts:'Appointments',
    ordParts:'Parts Orders',
    ordNoAppts:'No appointments yet',
    ordNoParts:'No parts orders yet',
    ordSignIn:'Sign in to view your bookings and orders',
    ordTotal:'Total',
    ordStDraft:'Draft',
    ordStPending:'Under Review',
    ordStSourcing:'Sourcing',
    ordStReady:'Ready',
    ordStDelivered:'Delivered',
    ordStCancelled:'Cancelled',
    ordLoading:'Loading your orders...',
    ordQar:'QAR',
    // Cart
    cartAdd:'+ Add',
    cartAdded:'✓ Added',
    cartBook:'Book All',
    cartCount:'services in cart',
    cartEmpty:'Choose a service to start',
    cartServices:'selected',
    ordPayReq:'Pay Now',
    ordPayPending:'Awaiting Confirmation ⏳',
    ordPaid:'Paid ✓',
    ordPartsLabel:'Parts',
    ordLaborLabel:'Labor / Work',
    ordPayParts:'Pay for Parts',
    ordPayLabor:'Pay for Labor',
    ordPayLaborHint:'Available after parts payment and order completion',
    // Quotation approval
    quotPending:'Quotation awaiting your approval',
    quotApproveBtn:'Approve Quotation',
    quotApproveConfirm:'Approve this quotation? Our team will start sourcing parts and working.',
    quotApproved:'✅ Quotation approved',
    quotApprovedLabel:'Approved',
    quotTotal:'Quotation Total',
    // Job card statuses
    jc_waiting:'Waiting',
    jc_confirmed:'Confirmed',
    jc_en_route:'Team En Route',
    jc_car_received:'Car Received',
    jc_at_workshop:'At Workshop',
    jc_in_maintenance:'Under Maintenance',
    jc_maintenance_done:'Maintenance Done',
    jc_washing:'Car Washing',
    jc_awaiting_invoice:'Awaiting Invoice',
    jc_returning:'Car Returning',
    jc_delivered:'Delivered',
    jc_number:'Job Card',
  },
};

// ── Job Status Colors ──────────────────────────────────────────────────
const JC_STATUS_COLOR = {
  waiting:'#94a3b8', confirmed:'#3b82f6', en_route:'#8b5cf6',
  car_received:'#f97316', at_workshop:'#eab308', in_maintenance:'#ef4444',
  maintenance_done:'#22c55e', washing:'#06b6d4', awaiting_invoice:'#a855f7',
  returning:'#f59e0b', delivered:'#16a34a',
};

// ── Services Data ──────────────────────────────────────────────────────
const SERVICES = [
  { key:'periodic',    ar:'صيانة دورية',          en:'Periodic Maintenance',  icon:Cog,          bg:'#FFCB74', fg:'#111111', ic:'rgba(17,17,17,0.15)',   span:2 },
  { key:'care',        ar:'عناية بالسيارات',       en:'Car Care',              icon:Sparkles,     bg:'#722F37', fg:'#FFCB74', ic:'rgba(255,203,116,0.18)', span:1 },
  { key:'parts',       ar:'توفير قطع غيار',        en:'Spare Parts',           icon:PackageSearch,bg:'#FFCB74', fg:'#111111', ic:'rgba(17,17,17,0.15)',   span:1 },
  { key:'diagnosis',   ar:'إصلاح وتشخيص أعطال',   en:'Fault Diagnosis',       icon:Search,       bg:'#722F37', fg:'#FFCB74', ic:'rgba(255,203,116,0.18)', span:2 },
  { key:'collision',   ar:'إصلاح حوادث',           en:'Collision Repair',      icon:ShieldCheck,  bg:'#FFCB74', fg:'#111111', ic:'rgba(17,17,17,0.15)',   span:2 },
  { key:'accessories', ar:'إكسسوارات',             en:'Accessories',           icon:Car,           bg:'#722F37', fg:'#FFCB74', ic:'rgba(255,203,116,0.18)', span:1 },
];

const SUB_SERVICES = {
  periodic: [
    { key:'oil_change',   ar:'تغيير الزيت',       en:'Oil Change' },
    { key:'filter',       ar:'تغيير الفلتر',      en:'Filter Replacement' },
    { key:'tires_check',  ar:'فحص وتوازن الإطارات', en:'Tire Check & Balance' },
    { key:'battery_check',ar:'فحص البطارية',      en:'Battery Check' },
    { key:'brakes_check', ar:'فحص الفرامل',       en:'Brakes Inspection' },
    { key:'full_service', ar:'صيانة شاملة',       en:'Full Service Package' },
  ],
  care: [
    { key:'wash',         ar:'غسيل خارجي وداخلي', en:'Full Wash' },
    { key:'polish',       ar:'تلميع وتشميع',       en:'Polish & Wax' },
    { key:'interior',     ar:'تنظيف داخلي عميق',  en:'Deep Interior Cleaning' },
    { key:'ceramic',      ar:'طلاء سيراميك',       en:'Ceramic Coating' },
    { key:'window_tint',  ar:'تظليل زجاج',         en:'Window Tinting' },
  ],
  parts: [
    { key:'oils',         ar:'زيوت محرك',          en:'Engine Oils' },
    { key:'filters_p',    ar:'فلاتر (هواء/زيت/فيول)', en:'Filters (Air/Oil/Fuel)' },
    { key:'brakes_parts', ar:'قطع فرامل',           en:'Brake Parts' },
    { key:'battery_p',    ar:'بطارية',              en:'Battery Replacement' },
    { key:'tires_p',      ar:'إطارات',              en:'Tires' },
  ],
  diagnosis: [
    { key:'computer_diag',ar:'تشخيص كمبيوتر',     en:'Computer Diagnosis' },
    { key:'engine_repair',ar:'إصلاح محرك',         en:'Engine Repair' },
    { key:'suspension',   ar:'نظام التعليق',        en:'Suspension System' },
    { key:'electrical',   ar:'نظام كهربائي',        en:'Electrical System' },
    { key:'ac_repair',    ar:'إصلاح تكييف',         en:'AC Repair' },
  ],
  collision: [
    { key:'dent',         ar:'إصلاح الدنت',         en:'Dent Repair' },
    { key:'paint',        ar:'دهان ولمعة',           en:'Paint & Polish' },
    { key:'body_repair',  ar:'إصلاح هيكل',          en:'Body Repair' },
    { key:'glass',        ar:'استبدال زجاج',         en:'Glass Replacement' },
  ],
  accessories: [
    { key:'dash_cam',     ar:'كاميرا داش',           en:'Dash Camera' },
    { key:'led',          ar:'مصابيح LED',            en:'LED Lights Upgrade' },
    { key:'seat_covers',  ar:'أغطية مقاعد',           en:'Seat Covers' },
    { key:'floor_mats',   ar:'سجاد أرضية',            en:'Floor Mats' },
    { key:'sound',        ar:'نظام صوت وشاشة',        en:'Sound System & Screen' },
  ],
};

const CAR_BRANDS = [
  { key:'toyota',   ar:'تويوتا',      en:'Toyota',   cats:[{key:'sedan',ar:'سيدان',en:'Sedan'},{key:'suv',ar:'دفع رباعي',en:'SUV'},{key:'pickup',ar:'بيك أب',en:'Pickup'}]},
  { key:'nissan',   ar:'نيسان',       en:'Nissan',   cats:[{key:'sedan',ar:'سيدان',en:'Sedan'},{key:'suv',ar:'دفع رباعي',en:'SUV'},{key:'sport',ar:'رياضية',en:'Sport'}]},
  { key:'lexus',    ar:'لكزس',        en:'Lexus',    cats:[{key:'sedan',ar:'سيدان',en:'Sedan'},{key:'suv',ar:'دفع رباعي',en:'SUV'}]},
  { key:'mercedes', ar:'مرسيدس',      en:'Mercedes', cats:[{key:'sedan',ar:'سيدان',en:'Sedan'},{key:'sport',ar:'رياضية',en:'Sport'}]},
  { key:'bmw',      ar:'بي إم دبليو', en:'BMW',      cats:[{key:'sedan',ar:'سيدان',en:'Sedan'},{key:'sport',ar:'رياضية',en:'Sport'},{key:'suv',ar:'دفع رباعي',en:'SUV'}]},
  { key:'audi',     ar:'أودي',        en:'Audi',     cats:[{key:'sedan',ar:'سيدان',en:'Sedan'},{key:'suv',ar:'دفع رباعي',en:'SUV'}]},
  { key:'hyundai',  ar:'هيونداي',     en:'Hyundai',  cats:[{key:'sedan',ar:'سيدان',en:'Sedan'},{key:'suv',ar:'دفع رباعي',en:'SUV'}]},
  { key:'kia',      ar:'كيا',         en:'Kia',      cats:[{key:'sedan',ar:'سيدان',en:'Sedan'},{key:'suv',ar:'دفع رباعي',en:'SUV'}]},
];

const TIME_SLOTS = [
  { key:'09:00 AM', ar:'٩:٠٠ ص', en:'9:00 AM' },
  { key:'11:00 AM', ar:'١١:٠٠ ص', en:'11:00 AM' },
  { key:'02:00 PM', ar:'٢:٠٠ م', en:'2:00 PM' },
  { key:'04:00 PM', ar:'٤:٠٠ م', en:'4:00 PM' },
  { key:'06:00 PM', ar:'٦:٠٠ م', en:'6:00 PM' },
];

// ── Category style map (icon + colors) keyed by name ──────────────────
const CAT_STYLE = {
  'صيانة دورية':        { icon:Cog },
  'عناية بالسيارات':    { icon:Sparkles },
  'توفير قطع غيار':     { icon:PackageSearch },
  'إصلاح وتشخيص أعطال':{ icon:Search },
  'إصلاح حوادث':        { icon:ShieldCheck },
  'إكسسوارات':          { icon:Car },
  'Periodic Maintenance':{ icon:Cog },
  'Car Care':            { icon:Sparkles },
  'Spare Parts':         { icon:PackageSearch },
  'Fault Diagnosis':     { icon:Search },
  'Collision Repair':    { icon:ShieldCheck },
  'Accessories':         { icon:Car },
};
const DEFAULT_CAT_STYLES = [
  { icon:Cog },
  { icon:Sparkles },
  { icon:Wrench },
  { icon:Search },
];
// ── Push Notifications ────────────────────────────────────────────────────
const VAPID_PUBLIC_KEY = 'BI7jNwdDx9eYM2bVIWSytWhDiZcmYI_8HFYc4fqF97vbej-zxPIXfS0nP8mrjQJPzeGcO76tN26vBK8vvg3qPRE';
function urlBase64ToUint8Array(b64) {
  const pad = '='.repeat((4 - b64.length % 4) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}
async function registerPushSubscription(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const existing = await reg.pushManager.getSubscription();
    const sub = existing || await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await supabase.from('push_subscriptions').upsert(
      { user_id: userId, subscription: sub.toJSON(), updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  } catch (e) { /* silent — push not supported or denied */ }
}

const CARD_BG_CYCLE = [
  { bg:'#FFCB74', ic:'rgba(17,17,17,0.12)', fg:'#111111', txt:'#111111', sub:'rgba(17,17,17,0.55)', div:'rgba(17,17,17,0.10)' },
  { bg:'#722F37', ic:'rgba(255,203,116,0.15)', fg:'#FFCB74', txt:'#ffffff', sub:'rgba(255,255,255,0.60)', div:'rgba(255,255,255,0.08)' },
];
// right card big / left card small, flipping every row (mobile 3-col grid)
const SPAN_CYCLE = [1, 2, 2, 1];
const enrichCat = (cat, idx) => {
  const style = CAT_STYLE[cat.name?.ar] || CAT_STYLE[cat.name?.en]
    || DEFAULT_CAT_STYLES[idx % DEFAULT_CAT_STYLES.length];
  const color = CARD_BG_CYCLE[idx % 2];
  const span = SPAN_CYCLE[idx % SPAN_CYCLE.length];
  return { ...style, ...color, span, fg:'#ffffff', id:cat.id, ar:cat.name?.ar||'', en:cat.name?.en||'', key:String(cat.id) };
};

// ── Helpers ────────────────────────────────────────────────────────────
const getBrand   = k => CAR_BRANDS.find(b => b.key === k);
const getCat     = (bk,ck) => getBrand(bk)?.cats.find(c => c.key === ck);
const getSlot    = k => TIME_SLOTS.find(t => t.key === k);

const BOOKING_YEAR_OPTIONS = (() => {
  const yr = new Date().getFullYear();
  return Array.from({ length: yr - 1930 + 1 }, (_, i) => yr - i);
})();

const sortByEn = arr => [...arr].sort((a, b) =>
  (a.name_en || a.name_ar || '').localeCompare(b.name_en || b.name_ar || '', 'en', { sensitivity: 'base' })
);
const brandLabel = (b, lang) => lang === 'en'
  ? (b.name_en || b.name_ar || '')
  : (b.name_en && b.name_ar ? `${b.name_en} · ${b.name_ar}` : (b.name_ar || b.name_en || ''));
const catLabel = (c, lang) => lang === 'en'
  ? (c.name_en || c.name_ar || '')
  : (c.name_en && c.name_ar ? `${c.name_en} · ${c.name_ar}` : (c.name_ar || c.name_en || ''));

const DARK_THEME = {
  bg:'#111111', panel:'#1A1A1A', card:'#FFCB74', cardText:'#1C1300', cardMuted:'rgba(28,19,0,0.62)', input:'#3A3A3A',
  border:'rgba(255,203,116,0.18)', borderFocus:'rgba(255,203,116,0.70)',
  gold:'#FFCB74', goldL:'#FFD990', text:'#F6F6F6',
  muted:'rgba(246,246,246,0.45)', dim:'rgba(246,246,246,0.22)',
  inputCls:'w-full px-4 py-3.5 rounded-xl text-[#F6F6F6] placeholder:text-[#F6F6F6]/30 outline-none text-sm font-cairo transition-all',
  selectCls:'text-[#F6F6F6]',
  phCls:'placeholder:text-[#F6F6F6]/30',
  colorScheme:'[color-scheme:dark]',
  btnTxt:'#111111',
  textAccent:'#FFCB74',
  navActiveBg:'#FFCB74', navActiveTxt:'#111111',
  heroBg:'linear-gradient(135deg, #722F37 0%, #4A1F24 100%)',
  heroShadow:'rgba(114,47,55,0.45)',
  heroOverlay:(r)=>r?'linear-gradient(to left, transparent 30%, #722F37 75%)':'linear-gradient(to right, transparent 30%, #722F37 75%)',
};
const LIGHT_THEME = {
  bg:'#FFFFFF', panel:'#FFFFFF', card:'#722F37', cardText:'#FFFFFF', cardMuted:'rgba(255,255,255,0.68)', input:'#ECECEC',
  border:'rgba(255,203,116,0.45)', borderFocus:'rgba(255,203,116,0.90)',
  gold:'#FFCB74', goldL:'#FFD990', text:'#111111',
  muted:'rgba(17,17,17,0.48)', dim:'rgba(17,17,17,0.22)',
  inputCls:'w-full px-4 py-3.5 rounded-xl text-[#111111] placeholder:text-[#111111]/35 outline-none text-sm font-cairo transition-all',
  selectCls:'text-[#111111]',
  phCls:'placeholder:text-[#111111]/35',
  colorScheme:'[color-scheme:light]',
  btnTxt:'#111111',
  textAccent:'#722F37',
  navActiveBg:'#722F37', navActiveTxt:'#FFCB74',
  heroBg:'linear-gradient(135deg, #722F37 0%, #4A1F24 100%)',
  heroShadow:'rgba(114,47,55,0.45)',
  heroOverlay:(r)=>r?'linear-gradient(to left, transparent 30%, #722F37 75%)':'linear-gradient(to right, transparent 30%, #722F37 75%)',
};
const C = { ...DARK_THEME };

const labelCls = 'block text-[11px] font-semibold tracking-widest uppercase mb-1.5';

const APPT_STATUS_LABELS = {
  ar: { pending:'قيد الانتظار', confirmed:'مؤكد', in_progress:'في الورشة', completed:'مكتمل', cancelled:'ملغي' },
  en: { pending:'Pending', confirmed:'Confirmed', in_progress:'In Progress', completed:'Completed', cancelled:'Cancelled' },
};

// ── APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang]         = useState('ar');
  const [page, setPage]         = useState('home'); // 'home' | 'services' | 'profile' | 'booking' | 'orders'
  const [step, setStep]         = useState(1);
  const [expandedService, setExpandedService] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState(null);
  const [authReason, setAuthReason] = useState(null);
  const [user, setUser]         = useState(null);
  const [profile, setProfile]   = useState(null);
  const [carBrands, setCarBrands]           = useState([]);
  const [carCategories, setCarCategories]   = useState([]);
  const [brandCategories, setBrandCategories] = useState([]); // [{brand_id, category_id}]
  const [serviceCategories, setServiceCategories] = useState([]);
  const [allSubServices, setAllSubServices]       = useState([]);
  const [cart, setCart] = useState([]); // [{id, name, catId, catName}]
  const [cartOpen, setCartOpen] = useState(false);
  const [homeAnnouncements, setHomeAnnouncements] = useState([]);
  const [pendingQuotCount, setPendingQuotCount] = useState(0);
  const addToCart    = (catId, subId, subName, catName) =>
    setCart(p => p.find(x => x.id === subId) ? p : [...p, { id: subId, name: subName, catId, catName }]);
  const removeFromCart = (subId) => setCart(p => p.filter(x => x.id !== subId));
  const clearCart = () => setCart([]);
  const [formData, setFormData] = useState({
    name:'', phone:'', carBrandKey:'', carBrandId: null, carCategoryKey:'',
    carModel:'', carId: null,
    serviceKey:'', serviceName:'', subServiceKey:'', subServiceName:'', date:'', timeKey:'', notes:'',
  });

  const [theme, setTheme] = useState(() => {
    const h = new Date().getHours();
    return h >= 6 && h < 18 ? 'light' : 'dark';
  });
  Object.assign(C, theme === 'light' ? LIGHT_THEME : DARK_THEME);
  const toggleTheme = () => setTheme(t => {
    const next = t === 'dark' ? 'light' : 'dark';
    localStorage.setItem('sndk_theme', next);
    return next;
  });

  const tr    = T[lang];
  const isRtl = lang === 'ar';
  const resetForm = () => setFormData({ name:'',phone:'',carBrandKey:'',carBrandId:null,carCategoryKey:'',carModel:'',carId:null,serviceKey:'',serviceName:'',subServiceKey:'',subServiceName:'',date:'',timeKey:'',notes:'' });

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile(data);
      setFormData(p => ({ ...p, name: data.full_name || p.name, phone: data.phone_number || p.phone }));
    }
  };

  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) { fetchProfile(session.user.id); registerPushSubscription(session.user.id); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') { setShowNewPassword(true); return; }
      setUser(session?.user ?? null);
      if (session?.user) { fetchProfile(session.user.id); if (event === 'SIGNED_IN') registerPushSubscription(session.user.id); }
      else { setProfile(null); }
    });
    // Load dynamic car brands, categories, and brand-category links
    supabase.from('car_brands').select('id,name_ar,name_en').or('is_active.eq.true,is_active.is.null').order('sort_order').order('id')
      .then(({ data }) => { if (data?.length) setCarBrands(data); });
    supabase.from('car_categories').select('id,name_ar,name_en').or('is_active.eq.true,is_active.is.null').order('sort_order').order('id')
      .then(({ data }) => { if (data?.length) setCarCategories(data); });
    supabase.from('brand_categories').select('brand_id,category_id')
      .then(({ data }) => { if (data) setBrandCategories(data); });
    // Load service categories and sub-services from Supabase
    supabase.from('service_categories').select('*').eq('is_active', true)
      .order('sort_order', { ascending:true, nullsFirst:false }).order('id')
      .then(({ data }) => { if (data) setServiceCategories(data); });
    supabase.from('services').select('*').eq('is_active', true)
      .order('sort_order', { ascending:true, nullsFirst:false }).order('id')
      .then(({ data }) => { if (data) setAllSubServices(data); });
    // Load all active announcements for slideshow
    supabase.from('announcements').select('*').eq('is_active', true).order('id', { ascending:false })
      .then(({ data }) => { if (data?.length) setHomeAnnouncements(data); });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); resetForm(); setMenuOpen(false);
    setPage('home');
  };

  // Called after successful login
  const handleAuthSuccess = () => {
    setAuthModal(null);
    if (authReason === 'book') {
      setPage('booking'); setStep(2); setAuthReason(null);
    }
  };

  // الانتقال لصفحة الخدمات (مع اختياري تحديد سيارة مسبقاً)
  const handleBookNow = () => goServices?.();
  const bookFromProfile = (car) => {
    if (car) {
      const brand = carBrands.find(b => b.name_ar === car.car_type || b.name_en === car.car_type);
      setFormData(p => ({
        ...p,
        carId: car.id,
        carBrandKey: car.car_type || '',
        carBrandId: brand?.id || null,
        carCategoryKey: car.car_category || '',
        carModel: car.production_year?.toString() || '',
      }));
    }
    goServices();
  };

  // بدء الحجز من سلة الخدمات
  const startBooking = () => {
    if (cart.length === 0) return;
    if (!user) { setAuthReason('book'); setAuthModal('signup'); return; }
    setPage('booking'); setStep(2);
  };

  const goHome     = () => { setPage('home'); setStep(1); resetForm(); setMenuOpen(false); };
  const goServices = () => { setPage('services'); setExpandedService(null); setMenuOpen(false); };
  const goProfile  = () => {
    if (!user) { setAuthModal('signin'); return; }
    setPage('profile'); setMenuOpen(false);
  };
  const goOrders   = () => {
    if (!user) { setAuthModal('signin'); return; }
    setPendingQuotCount(0); // clear badge when user opens orders
    setPage('orders'); setMenuOpen(false);
  };

  const shared = { lang, tr, formData, setFormData, setStep, isRtl, user, profile, setAuthModal, carBrands, carCategories, brandCategories, serviceCategories, allSubServices, cart, addToCart, removeFromCart, startBooking };

  const isBooking = page === 'booking' && step >= 2;

  return (
    <div dir={isRtl?'rtl':'ltr'} className="font-cairo" style={{ minHeight:'100vh', background:C.bg, color:C.text }}>
      <div className="md:flex md:h-screen md:overflow-hidden">

        {/* ══ DESKTOP SIDEBAR ══ */}
        <aside className="hidden md:flex md:flex-col md:w-60 md:flex-shrink-0 md:h-full"
          style={{ background:C.panel, borderInlineEnd:`1px solid ${C.border}` }}>
          <div className="flex items-center justify-center p-1" style={{ borderBottom:`1px solid ${C.border}` }}>
            <img src="/logo-animated.gif" alt="SNDK" style={{ width:'100%', height:'auto' }}/>
          </div>
          <nav className="flex-1 px-3 py-5 space-y-1">
            {[
              { icon:Home,          label:tr.navHome,    active:page==='home',     action:goHome },
              { icon:Sparkles,      label:tr.navServices,active:page==='services', action:goServices },
              { icon:ClipboardList, label:tr.navOrders,  active:page==='orders',   action:goOrders },
              { icon:User,          label:tr.navProfile,  active:page==='profile',  action:goProfile },
              { icon:Phone,         label:tr.navContact,  active:false,             action:()=>{} },
            ].map((item,i) => (
              <button key={i} onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                style={item.active ? { background:C.navActiveBg, color:C.navActiveTxt, boxShadow:`0 0 20px ${C.navActiveBg}50` } : { color:C.muted }}>
                <item.icon size={17}/>{item.label}
              </button>
            ))}
          </nav>

          {/* ── Sidebar Cart Widget (always visible, clickable) ── */}
          <div className="px-3 pb-3">
            <div onClick={() => setCartOpen(true)} className="rounded-2xl p-3 transition-all cursor-pointer" style={{
              background: cart.length > 0 ? `${C.gold}18` : `${C.gold}0A`,
              border: `1px solid ${cart.length > 0 ? `${C.gold}55` : `${C.gold}28`}`,
              boxShadow: cart.length > 0 ? `0 2px 14px ${C.gold}22` : 'none',
            }}>
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart size={14} style={{ color: cart.length > 0 ? C.gold : `${C.gold}80` }}/>
                <span className="text-xs font-black" style={{ color: cart.length > 0 ? C.gold : C.muted }}>
                  {isRtl ? 'سلة الخدمات' : 'Service Cart'}
                </span>
                {cart.length > 0 && (
                  <span className="ms-auto text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background:C.gold, color:C.btnTxt }}>{cart.length}</span>
                )}
              </div>
              {cart.length === 0 ? (
                <p className="text-[11px]" style={{ color:C.muted }}>
                  {isRtl ? 'سلتك فارغة' : 'Your cart is empty'}
                </p>
              ) : (
                <>
                  <div className="space-y-1.5 mb-3">
                    {cart.slice(0, 4).map(item => (
                      <div key={item.id} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background:C.gold }}/>
                        <span className="text-[11px] truncate flex-1 font-semibold" style={{ color:C.text }}>{item.name}</span>
                        <button onClick={e => { e.stopPropagation(); removeFromCart(item.id); }}
                          className="flex-shrink-0 p-0.5 rounded transition-colors hover:opacity-70"
                          style={{ color:C.muted }}>
                          <X size={10}/>
                        </button>
                      </div>
                    ))}
                    {cart.length > 4 && (
                      <p className="text-[10px] ps-3" style={{ color:C.muted }}>
                        +{cart.length - 4} {isRtl ? 'خدمات أخرى' : 'more'}
                      </p>
                    )}
                  </div>
                  <button onClick={e => { e.stopPropagation(); startBooking(); }}
                    className="w-full py-2 rounded-xl text-xs font-black transition-all active:scale-95"
                    style={{ background:C.gold, color:C.btnTxt, boxShadow:`0 2px 10px ${C.gold}50` }}>
                    {!user && <Lock size={10} className="inline me-1.5"/>}
                    {isRtl ? 'احجز الكل ←' : 'Book All →'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="px-3 py-4 space-y-2" style={{ borderTop:`1px solid ${C.border}` }}>
            {user ? (
              <div className="space-y-2">
                <button onClick={goProfile} className="w-full px-3 py-2 rounded-xl text-start transition-all" style={{ background:`${C.gold}12` }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color:`${C.textAccent}88` }}>{tr.loggedAs}</p>
                  <p className="text-sm font-bold truncate" style={{ color:C.textAccent }}>{profile?.full_name||user.email}</p>
                </button>
                <button onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ border:`1px solid rgba(255,100,100,0.25)`, color:'rgba(255,120,120,0.8)' }}>
                  {tr.signOut}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button onClick={()=>setAuthModal('signin')} className="w-full py-2.5 rounded-xl text-sm font-black transition-all" style={{ background:C.gold, color:C.btnTxt }}>{tr.signIn}</button>
                <button onClick={()=>setAuthModal('signup')} className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ border:`1px solid ${C.border}`, color:C.gold }}>{tr.signUp}</button>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={()=>setLang(l=>l==='ar'?'en':'ar')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={{ color:C.muted }}>
                <Globe size={12}/>{tr.switchLang}
              </button>
              <button onClick={toggleTheme}
                className="flex items-center justify-center px-3 py-2 rounded-xl transition-all"
                style={{ color:C.muted, border:`1px solid ${C.border}` }}
                title={theme==='dark'?(isRtl?'النمط الفاتح':'Light Mode'):(isRtl?'النمط الداكن':'Dark Mode')}>
                {theme==='dark' ? <Sun size={14}/> : <Moon size={14}/>}
              </button>
            </div>
          </div>
        </aside>

        {/* ══ MAIN COLUMN ══ */}
        <div className="flex-1 flex flex-col md:h-full md:overflow-hidden">

          {/* Mobile Header */}
          <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3"
            style={{ background:`${C.panel}F5`, backdropFilter:'blur(16px)', borderBottom:`1px solid ${C.border}` }}>
            <button onClick={()=>setMenuOpen(true)} className="p-2 rounded-lg transition-colors" style={{ color:C.gold }}>
              <Menu size={22}/>
            </button>
            <img src="/logo-animated.gif" alt="SNDK" style={{ height:52, width:'auto' }}/>
            <div className="flex items-center gap-1">
              <button onClick={toggleTheme} className="p-2 rounded-lg transition-colors" style={{ color:C.gold }}>
                {theme==='dark' ? <Sun size={17}/> : <Moon size={17}/>}
              </button>
              <button onClick={()=>setLang(l=>l==='ar'?'en':'ar')} className="px-2 py-1 rounded-lg text-xs font-bold" style={{ color:C.gold }}>{tr.switchLang}</button>
              {user ? (
                <button onClick={goProfile} className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm" style={{ background:C.gold, color:C.btnTxt }}>
                  {(profile?.full_name||user.email||'?')[0].toUpperCase()}
                </button>
              ) : (
                <button onClick={()=>setAuthModal('signin')} className="px-3 py-1.5 rounded-lg text-xs font-black transition-all" style={{ background:C.gold, color:C.btnTxt }}>
                  {tr.signIn}
                </button>
              )}
            </div>
          </header>

          {/* Desktop back bar during booking */}
          {isBooking && (
            <div className="hidden md:flex items-center gap-4 px-8 py-4" style={{ borderBottom:`1px solid ${C.border}`, background:`${C.panel}80` }}>
              <button onClick={()=>setStep(s=>Math.max(2,s-1))}
                className="flex items-center gap-1.5 text-sm font-semibold transition-colors" style={{ color:C.muted }}>
                {isRtl?<ChevronRight size={15}/>:<ChevronLeft size={15}/>}{tr.back}
              </button>
              <div className="flex-1 flex items-center justify-center gap-2">
                {tr.steps.map((s,i) => (
                  <React.Fragment key={i}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all"
                        style={step===i+2 ? { background:C.gold, color:C.btnTxt, boxShadow:`0 0 12px ${C.gold}80` }
                          : step>i+2 ? { background:`${C.gold}25`, color:C.gold }
                          : { background:'rgba(255,255,255,0.06)', color:C.dim }}>
                        {step>i+2?'✓':i+1}
                      </div>
                      <span className="text-xs font-semibold" style={{ color:step===i+2?C.gold:C.dim }}>{s}</span>
                    </div>
                    {i<3&&<div className="w-8 h-px" style={{ background:step>i+2?`${C.gold}40`:'rgba(255,255,255,0.08)' }}/>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
            {page==='home'    && <HomeView {...shared} onBookNow={handleBookNow} goServices={goServices} homeAnnouncements={homeAnnouncements} goOrders={goOrders} pendingQuotCount={pendingQuotCount}/>}
            {page==='services'&& <ServicesView lang={lang} tr={tr} isRtl={isRtl} expanded={expandedService} setExpanded={setExpandedService} serviceCategories={serviceCategories} allSubServices={allSubServices} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} theme={theme}/>}
            {page==='profile' && user && <ProfileView lang={lang} tr={tr} isRtl={isRtl} profile={profile} user={user} onBook={(car)=>bookFromProfile(car)} goServices={goServices} goOrders={goOrders} onProfileUpdated={()=>fetchProfile(user.id)} carBrands={carBrands} carCategories={carCategories} brandCategories={brandCategories}/>}
            {page==='orders'  && <MyOrdersView lang={lang} tr={tr} isRtl={isRtl} user={user} profile={profile} onCountChange={setPendingQuotCount} theme={theme}/>}
            {page==='booking' && step===2 && <DetailsStep {...shared} prevStep={()=>setPage('home')}/>}
            {page==='booking' && step===3 && <ScheduleStep {...shared} prevStep={()=>setStep(2)}/>}
            {page==='booking' && step===4 && <ReviewStep   {...shared} prevStep={()=>setStep(3)} loading={loading} setLoading={setLoading}/>}
            {page==='booking' && step===5 && <SuccessStep  tr={tr} name={formData.name} resetAll={()=>{ resetForm(); clearCart(); setPage('home'); setStep(1); }} goOrders={()=>{ resetForm(); clearCart(); setStep(1); goOrders(); }}/>}
          </main>

          {/* Mobile Bottom Nav */}
          <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-around px-2 py-2"
            style={{ background:`${C.panel}F5`, backdropFilter:'blur(16px)', borderTop:`1px solid ${C.border}` }}>
            <MobNavItem icon={Home}         label={tr.navHome}    active={page==='home'}    onClick={goHome}/>
            <MobNavItem icon={Sparkles}    label={tr.navServices} active={page==='services'} onClick={goServices}/>
            <button onClick={()=>handleBookNow()}
              className="relative -top-5 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{ background:C.gold, boxShadow:`0 0 24px ${C.gold}90` }}>
              <Plus size={24} color={C.bg} strokeWidth={2.5}/>
            </button>
            <MobNavItem icon={ClipboardList} label={tr.navOrders} active={page==='orders'}  onClick={goOrders} badge={page==='orders'?0:pendingQuotCount}/>
            <button onClick={() => setCartOpen(true)} className="flex flex-col items-center gap-1 px-3 py-1">
              <div className="relative">
                <ShoppingCart size={20} color={cart.length > 0 ? C.gold : C.dim}/>
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -end-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full text-[8px] font-black flex items-center justify-center"
                    style={{ background:C.gold, color:C.btnTxt }}>
                    {cart.length > 9 ? '9+' : cart.length}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-semibold" style={{ color: cart.length > 0 ? C.gold : C.dim }}>
                {isRtl ? 'سلتي' : 'Cart'}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* ── App-level Cart Drawer ── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background:'rgba(0,0,0,0.65)', direction:isRtl?'rtl':'ltr' }}
          onClick={() => setCartOpen(false)}>
          <div className="rounded-t-3xl p-5 pb-10 flex flex-col gap-4 max-h-[80vh]"
            style={{ background:C.panel, border:`1px solid ${C.gold}25` }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} style={{ color:C.gold }}/>
                <h3 className={`font-black ${C.selectCls} text-base`}>
                  {isRtl ? 'سلة الخدمات' : 'Service Cart'}
                </h3>
                {cart.length > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${C.gold}22`, color:C.gold }}>
                    {cart.length}
                  </span>
                )}
              </div>
              <button onClick={() => setCartOpen(false)} className="p-1 rounded-lg" style={{ color:C.muted }}>
                <X size={18}/>
              </button>
            </div>
            {/* Items or empty state */}
            {cart.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-3">
                <ShoppingCart size={40} style={{ color:`${C.gold}30` }}/>
                <p className="text-sm" style={{ color:C.muted }}>
                  {isRtl ? 'سلتك فارغة — اختر خدمة من القائمة' : 'Your cart is empty — pick a service'}
                </p>
                <button onClick={() => { setCartOpen(false); goServices(); }}
                  className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background:`${C.gold}18`, color:C.gold, border:`1px solid ${C.gold}30` }}>
                  {isRtl ? '← تصفح الخدمات' : 'Browse services →'}
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-y-auto flex-1 space-y-2" style={{ maxHeight:'45vh' }}>
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background:`${C.gold}10`, border:`1px solid ${C.gold}20` }}>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${C.selectCls} truncate`}>{item.name}</p>
                        <p className="text-xs mt-0.5" style={{ color:C.muted }}>{item.catName}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)}
                        className="p-2 rounded-lg flex-shrink-0 transition-all active:scale-90"
                        style={{ background:'rgba(220,50,50,0.12)', color:'#ff6b6b' }}>
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setCartOpen(false); goServices(); }}
                    className="flex-1 py-3 rounded-xl text-sm font-bold"
                    style={{ background:`${C.gold}15`, color:C.gold, border:`1px solid ${C.gold}25` }}>
                    {isRtl ? '+ إضافة المزيد' : '+ Add more'}
                  </button>
                  <button onClick={() => { setCartOpen(false); startBooking(); }}
                    className="flex-1 py-3 rounded-xl text-sm font-black transition-all active:scale-95"
                    style={{ background:C.gold, color:C.btnTxt, boxShadow:`0 0 16px ${C.gold}40` }}>
                    {!user && <Lock size={10} className="inline me-1.5"/>}
                    {isRtl ? 'احجز الكل ←' : 'Book All →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" style={{ direction:isRtl?'rtl':'ltr' }}>
          <div className="absolute inset-0" style={{ background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)' }} onClick={()=>setMenuOpen(false)}/>
          <div className="relative w-72 h-full flex flex-col shadow-2xl" style={{ background:C.panel }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom:`1px solid ${C.border}` }}>
              <img src="/logo-animated.gif" alt="SNDK" style={{ height:56, width:'auto' }}/>
              <button onClick={()=>setMenuOpen(false)} style={{ color:C.muted }}><X size={20}/></button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {user && (
                <div className="px-4 py-3 mb-2 rounded-xl" style={{ background:`${C.gold}12` }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color:`${C.textAccent}88` }}>{tr.loggedAs}</p>
                  <p className="text-sm font-bold" style={{ color:C.textAccent }}>{profile?.full_name||user.email}</p>
                </div>
              )}
              {[
                { icon:Home,          label:tr.navHome,    action:goHome },
                { icon:Sparkles,      label:tr.navServices, action:goServices },
                { icon:ClipboardList, label:tr.navOrders,  action:goOrders },
                { icon:User,          label:tr.navProfile,  action:goProfile },
                { icon:Phone,         label:tr.navContact,  action:()=>setMenuOpen(false) },
              ].map((item,i)=>(
                <button key={i} onClick={item.action} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all" style={{ color:C.muted }}>
                  <item.icon size={17}/>{item.label}
                </button>
              ))}
            </nav>
            <div className="p-3 space-y-2" style={{ borderTop:`1px solid ${C.border}` }}>
              {user ? (
                <button onClick={handleSignOut} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ border:`1px solid rgba(255,100,100,0.25)`, color:'rgba(255,120,120,0.8)' }}>
                  {tr.signOut}
                </button>
              ) : (
                <>
                  <button onClick={()=>{setAuthModal('signin');setMenuOpen(false);}} className="w-full py-2.5 rounded-xl text-sm font-black" style={{ background:C.gold, color:C.btnTxt }}>{tr.signIn}</button>
                  <button onClick={()=>{setAuthModal('signup');setMenuOpen(false);}} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ border:`1px solid ${C.border}`, color:C.gold }}>{tr.signUp}</button>
                </>
              )}
              <div className="flex gap-2">
                <button onClick={()=>{setLang(l=>l==='ar'?'en':'ar');setMenuOpen(false);}} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ color:C.muted }}>
                  <Globe size={12}/>{tr.switchLang}
                </button>
                <button onClick={toggleTheme} className="flex items-center justify-center px-3 py-2 rounded-xl transition-all" style={{ color:C.muted, border:`1px solid ${C.border}` }}>
                  {theme==='dark' ? <Sun size={14}/> : <Moon size={14}/>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {authModal && (
        <AuthModal mode={authModal} setMode={setAuthModal} tr={tr} isRtl={isRtl}
          reason={authReason} onSuccess={handleAuthSuccess}/>
      )}
      {showNewPassword && (
        <NewPasswordModal tr={tr} isRtl={isRtl} onClose={() => setShowNewPassword(false)}/>
      )}
    </div>
  );
}

// ── MY ORDERS VIEW ────────────────────────────────────────────────────
function PaymentRow({ label, amount, status, canPay, disabledHint, onPay, tr, isRtl, cc }) {
  const PAY_ST = {
    paid:    { bg:'rgba(34,197,94,0.15)',  text:'#22c55e', label: tr.ordPaid },
    pending: { bg:'rgba(234,179,8,0.15)',  text:'#eab308', label: tr.ordPayPending },
    unpaid:  { bg:'rgba(100,116,139,0.12)', text:'#94a3b8', label: tr.ordPayReq },
  };
  const st = PAY_ST[status] || PAY_ST.unpaid;
  const labelColor = cc ? cc.sub : C.muted;
  const amountColor = cc ? cc.fg  : C.gold;
  const divColor    = cc ? cc.div : C.border;
  const btnBg       = cc ? cc.fg  : C.gold;
  const btnTxt      = cc ? cc.bg  : C.btnTxt;
  return (
    <div className="px-4 py-3 flex items-center justify-between gap-3"
      style={{ borderTop:`1px solid ${divColor}` }}>
      <div>
        <p className="text-[11px] font-semibold" style={{ color:labelColor }}>{label}</p>
        <p className="text-base font-black" style={{ color:amountColor }}>
          {amount.toFixed(3)} {tr.ordQar}
        </p>
      </div>
      {status === 'paid' && (
        <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background:st.bg, color:st.text }}>
          {st.label}
        </span>
      )}
      {status === 'pending' && (
        <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background:st.bg, color:st.text }}>
          {st.label}
        </span>
      )}
      {status === 'unpaid' && canPay && (
        <button onClick={onPay}
          className="px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 hover:brightness-110"
          style={{ background:btnBg, color:btnTxt }}>
          {tr.ordPayReq}
        </button>
      )}
      {status === 'unpaid' && !canPay && disabledHint && (
        <span className="text-[10px] text-end" style={{ color:labelColor, opacity:0.55, maxWidth:'100px' }}>{disabledHint}</span>
      )}
    </div>
  );
}

const parseServices = (st) => {
  if (!st) return null;
  if (st.startsWith('[')) {
    try { return JSON.parse(st); } catch {}
  }
  return null;
};

function SignatureModal({ isRtl, theme, onConfirm, onClose }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState('draw');
  const [typedName, setTypedName] = useState('');
  const [saving, setSaving] = useState(false);
  const lastPos = useRef({ x:0, y:0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = Math.round(rect.width)  || 300;
    canvas.height = Math.round(rect.height) || 150;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [mode]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const src    = e.touches ? e.touches[0] : e;
    return { x:(src.clientX - rect.left)*scaleX, y:(src.clientY - rect.top)*scaleY };
  };

  const startDraw = (e) => { e.preventDefault(); lastPos.current = getPos(e); setIsDrawing(true); };
  const draw = (e) => {
    if (!isDrawing) return; e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const pos    = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b'; ctx.stroke();
    lastPos.current = pos;
  };
  const endDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const confirm = async () => {
    if (saving) return;
    let sigData = null, sigName = null;
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      const imgData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      const hasContent = Array.from({ length: imgData.length/4 }, (_, i) =>
        imgData[i*4] < 250 || imgData[i*4+1] < 250 || imgData[i*4+2] < 250
      ).some(Boolean);
      if (!hasContent) { alert(isRtl ? 'ارسم توقيعك أولاً' : 'Please draw your signature first'); return; }
      sigData = canvas.toDataURL('image/png');
    } else {
      if (!typedName.trim()) { alert(isRtl ? 'أدخل اسمك أولاً' : 'Please enter your name first'); return; }
      sigName = typedName.trim();
    }
    setSaving(true);
    await onConfirm(sigData, sigName);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {(() => {
        const mc = CARD_BG_CYCLE[0]; // always gold
        return (
      <div className="rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}
        style={{ background:mc.bg, border:'1px solid rgba(138,21,56,0.45)', boxShadow:'0 25px 60px rgba(0,0,0,0.6)' }}>
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor:mc.div }}>
          <div>
            <h3 className="font-black text-base" style={{ color:mc.txt }}>{isRtl ? 'توقيع الموافقة' : 'Approval Signature'}</h3>
            <p className="text-xs mt-0.5" style={{ color:mc.sub }}>{isRtl ? 'وقّع للتأكيد على موافقتك' : 'Sign to confirm your approval'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-all" style={{ color:mc.sub }}>
            <X size={18}/>
          </button>
        </div>
        <div className="px-5 pt-4 flex gap-2">
          {[{ k:'draw', ar:'✍️ رسم التوقيع', en:'✍️ Draw' }, { k:'type', ar:'⌨️ كتابة الاسم', en:'⌨️ Type Name' }].map(m => (
            <button key={m.k} onClick={() => setMode(m.k)} className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background:mode===m.k?'#8A1538':'rgba(0,0,0,0.12)', color:mode===m.k?'#fff':mc.sub }}>
              {isRtl ? m.ar : m.en}
            </button>
          ))}
        </div>
        <div className="p-5 space-y-3">
          {mode === 'draw' ? (
            <div>
              <canvas ref={canvasRef} className="w-full rounded-xl touch-none block"
                style={{ height:150, border:'2px dashed rgba(138,21,56,0.50)', cursor:'crosshair', background:'#fff' }}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs" style={{ color:C.muted }}>{isRtl ? '↑ وقّع بإصبعك على الشاشة أو بالماوس' : '↑ Sign with finger or mouse above'}</p>
                <button onClick={clearCanvas} className="text-xs font-bold px-2 py-1 rounded-lg" style={{ color:'#ef4444', background:'rgba(239,68,68,0.1)' }}>
                  {isRtl ? 'مسح' : 'Clear'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input value={typedName} onChange={e => setTypedName(e.target.value)}
                placeholder={isRtl ? 'أدخل اسمك الكامل...' : 'Enter your full name...'}
                className={`w-full px-4 py-3.5 rounded-xl ${C.selectCls} outline-none`}
                style={{ background:C.input, border:'1px solid rgba(138,21,56,0.45)', fontSize:20, fontFamily:'Georgia, serif', fontStyle:'italic' }}
                dir="rtl"
              />
              <p className="text-xs mt-2" style={{ color:C.muted }}>
                {isRtl ? 'سيظهر اسمك كتوقيع على وثيقة الموافقة' : 'Your name will appear as signature on the approval document'}
              </p>
            </div>
          )}
          <button onClick={confirm} disabled={saving} className="w-full py-3.5 rounded-xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60" style={{ background:'#8A1538', color:'#fff' }}>
            {saving
              ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>{isRtl ? 'جاري الحفظ...' : 'Saving...'}</>
              : isRtl ? '✅ تأكيد الموافقة والتوقيع' : '✅ Confirm Approval & Sign'
            }
          </button>
        </div>
      </div>
        );
      })()}
    </div>
  );
}

function openQuotationPDF(order, linked, profile, jobCard) {
  const isApproved = !!order.customer_approved;
  const approvalDate = order.approved_at
    ? new Date(order.approved_at).toLocaleString('ar-QA', { dateStyle:'long', timeStyle:'short' }) : '';
  const approvalDateEn = order.approved_at
    ? new Date(order.approved_at).toLocaleString('en-QA', { dateStyle:'long', timeStyle:'short' }) : '';
  const grandTotal = (Number(order.total_parts_price)||0) + (Number(order.total_labor_price)||0);
  const car = linked?.cars || {};
  const items = order.order_items || [];
  const partItems = items.filter(i => i.item_type === 'part');
  const laborItems = items.filter(i => i.item_type === 'labor');
  const serviceLabel = (() => {
    if (!linked?.service_type) return '';
    try { return JSON.parse(linked.service_type).map(s => s.name || s).join(' · '); } catch { return linked.service_type; }
  })();

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>أمر الشغل – SNDK Job Card</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;background:#fff;color:#1a1a1a;padding:24px;max-width:820px;margin:0 auto}
  .print-btn{position:fixed;top:14px;right:14px;background:#8A1538;color:#fff;border:none;padding:10px 22px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;z-index:999;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
  @media print{.print-btn{display:none}body{padding:0}}
  .header{display:flex;justify-content:space-between;align-items:flex-start;padding:18px 0 14px;border-bottom:3px solid #8A1538;margin-bottom:18px}
  .brand-ar{font-size:30px;font-weight:900;color:#8A1538;line-height:1}
  .brand-en{font-size:13px;color:#D4AF37;font-weight:700;margin-top:3px}
  .brand-sub{font-size:11px;color:#999;margin-top:2px}
  .doc-info{text-align:left}
  .doc-title-ar{font-size:16px;font-weight:900;color:#8A1538}
  .doc-title-en{font-size:12px;font-weight:700;color:#666;margin-top:2px}
  .doc-num{font-size:13px;font-weight:700;color:#8A1538;margin-top:5px;font-family:monospace}
  .section{margin-bottom:14px}
  .section-title{font-size:10px;font-weight:700;color:#8A1538;letter-spacing:1px;text-transform:uppercase;padding:4px 0;border-bottom:1px solid #f5e6e6;margin-bottom:9px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:9px}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px}
  .field{background:#f8fafc;border-radius:7px;padding:8px 10px}
  .field-label{font-size:10px;color:#999;margin-bottom:2px}
  .field-value{font-size:13px;font-weight:600;color:#1a1a1a}
  .textarea-field{background:#f8fafc;border-radius:7px;padding:10px;min-height:50px;font-size:12px;color:#334155;white-space:pre-wrap;line-height:1.5}
  table{width:100%;border-collapse:collapse;font-size:12px}
  thead tr{background:#8A1538;color:#fff}
  thead th{padding:8px 10px;text-align:right;font-weight:700;font-size:11px}
  tbody tr:nth-child(even){background:#fdf8f5}
  tbody td{padding:7px 10px;border-bottom:1px solid #f5ece6;vertical-align:top}
  .badge{display:inline-block;font-size:10px;font-weight:700;padding:2px 6px;border-radius:8px;margin-bottom:2px}
  .badge-part{background:#dbeafe;color:#1d4ed8}
  .badge-labor{background:#f3e8ff;color:#7c3aed}
  .totals{margin-top:12px;background:#fdf8f5;border:1px solid #f5e6d3;border-radius:9px;padding:12px 15px}
  .totals-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:3px 0}
  .totals-grand{font-size:16px;font-weight:900;color:#8A1538;border-top:2px solid #8A1538;margin-top:7px;padding-top:8px}
  .approval-box{margin-top:20px;padding:20px;border:2px solid #16a34a;border-radius:11px;background:#f0fdf4;text-align:center}
  .approval-icon{font-size:36px;margin-bottom:8px}
  .approval-ar{font-size:16px;font-weight:900;color:#15803d;margin-bottom:4px}
  .approval-en{font-size:13px;font-weight:700;color:#15803d;margin-bottom:10px}
  .approval-date{font-size:11px;color:#555;border-top:1px dashed #86efac;padding-top:8px}
  .pending-box{margin-top:16px;padding:12px;border:2px dashed #f59e0b;border-radius:9px;background:#fffbeb;text-align:center;font-size:12px;color:#92400e}
  .footer{margin-top:24px;padding-top:10px;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:10px;color:#aaa}
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">🖨️ طباعة / Save as PDF</button>

<div class="header">
  <div>
    <img src="${window.location.origin}/logo-static.png" alt="SNDK" style="height:48px;display:block"/>
    <div class="brand-sub" style="margin-top:4px">Premium Car Services — Qatar</div>
  </div>
  <div class="doc-info">
    <div class="doc-title-ar">أمر الشغل / Job Card</div>
    <div class="doc-title-en">Work Order</div>
    ${jobCard?.job_number ? `<div class="doc-num">${jobCard.job_number}</div>` : ''}
    <div style="font-size:11px;color:#999;margin-top:3px">${linked?.appointment_date || '—'}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">بيانات العميل / Customer Info</div>
  <div class="grid2">
    <div class="field"><div class="field-label">الاسم / Name</div><div class="field-value">${profile?.full_name || '—'}</div></div>
    <div class="field"><div class="field-label">الجوال / Phone</div><div class="field-value" dir="ltr">${profile?.phone_number ? '+974 ' + profile.phone_number : '—'}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">بيانات السيارة / Car Info</div>
  <div class="grid2" style="margin-bottom:8px">
    <div class="field"><div class="field-label">السيارة / Car</div><div class="field-value">${[car.car_type, car.car_category, car.production_year].filter(Boolean).join(' ') || '—'}</div></div>
    <div class="field"><div class="field-label">اللوحة / Plate</div><div class="field-value" dir="ltr">${car.plate_number || '—'}</div></div>
  </div>
  ${car.chassis_number ? `<div class="field"><div class="field-label">رقم الشاصيه / VIN</div><div class="field-value" dir="ltr" style="font-family:monospace;letter-spacing:1px">${car.chassis_number}</div></div>` : ''}
  ${serviceLabel ? `<div class="field" style="margin-top:8px"><div class="field-label">الخدمة / Service</div><div class="field-value">${serviceLabel}</div></div>` : ''}
</div>

${(jobCard?.mileage_in || jobCard?.mileage_out) ? `
<div class="section">
  <div class="section-title">العداد / Mileage</div>
  <div class="grid2">
    <div class="field"><div class="field-label">عند الاستلام / In</div><div class="field-value">${jobCard.mileage_in || '—'} km</div></div>
    <div class="field"><div class="field-label">عند التسليم / Out</div><div class="field-value">${jobCard.mileage_out || '—'} km</div></div>
  </div>
</div>` : ''}

${jobCard?.customer_complaints ? `
<div class="section">
  <div class="section-title">ملاحظات العميل / Customer Complaints</div>
  <div class="textarea-field">${jobCard.customer_complaints}</div>
</div>` : ''}

${jobCard?.work_done ? `
<div class="section">
  <div class="section-title">الأعمال المنجزة / Work Done</div>
  <div class="textarea-field">${jobCard.work_done}</div>
</div>` : ''}

${(partItems.length > 0 || laborItems.length > 0) ? `
<div class="section">
  <div class="section-title">عرض السعر / Quotation</div>
  <table>
    <thead><tr>
      <th style="width:30px">#</th>
      <th>البند / Item</th>
      <th style="width:55px;text-align:center">الكمية / Qty</th>
      <th style="width:105px">السعر / Price</th>
      <th style="width:110px">الإجمالي / Total</th>
    </tr></thead>
    <tbody>
      ${[...partItems, ...laborItems].map((item, i) => {
        const nameAr = item.item_name?.ar || item.item_name?.en || '—';
        const nameEn = item.item_name?.en || '';
        const discountPct = Number(item.discount_pct||0);
        const lineTotal = (Number(item.sell_price) * Number(item.quantity) * (1 - Math.min(discountPct,100)/100)).toFixed(3);
        return `<tr>
          <td style="color:#999;font-size:11px">${i+1}</td>
          <td>
            <span class="badge ${item.item_type==='labor'?'badge-labor':'badge-part'}">${item.item_type==='labor'?'عمالة / Labor':'قطعة / Part'}</span><br>
            <span style="font-weight:600">${nameAr}</span>
            ${nameEn && nameEn !== nameAr ? `<span style="font-size:11px;color:#666;margin-right:5px">(${nameEn})</span>` : ''}
            ${item.part_number ? `<span style="font-size:10px;color:#aaa;display:block;font-family:monospace">${item.part_number}</span>` : ''}
          </td>
          <td style="text-align:center;font-weight:600">${item.quantity}</td>
          <td dir="ltr" style="font-size:12px;font-weight:600">${Number(item.sell_price).toFixed(3)}${discountPct>0?`<br><span style="color:#dc2626;font-size:10px">-${discountPct.toFixed(0)}%</span>`:''}</td>
          <td dir="ltr" style="font-weight:700;color:#8A1538">${lineTotal}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
  <div class="totals">
    ${Number(order.total_parts_price) > 0 ? `<div class="totals-row"><span>قطع الغيار / Parts</span><span dir="ltr">${Number(order.total_parts_price).toFixed(3)} ر.ق</span></div>` : ''}
    ${Number(order.total_labor_price) > 0 ? `<div class="totals-row"><span>مصنعيات / Labor</span><span dir="ltr">${Number(order.total_labor_price).toFixed(3)} ر.ق</span></div>` : ''}
    <div class="totals-row totals-grand"><span>الإجمالي / Total</span><span dir="ltr">${grandTotal.toFixed(3)} QAR</span></div>
  </div>
</div>` : ''}

${isApproved ? `
<div class="approval-box">
  <div class="approval-icon">✅</div>
  <div class="approval-ar">تمت موافقة العميل عن طريق التطبيق الإلكتروني</div>
  <div class="approval-en">Customer Approved via the Electronic Application</div>
  <div class="approval-date">
    وقت الموافقة / Approval Time:<br>
    <strong>${approvalDate}</strong><br><strong>${approvalDateEn}</strong>
  </div>
  ${order.signature_data ? `
  <div style="margin-top:14px;padding-top:12px;border-top:1px dashed #86efac">
    <p style="font-size:11px;color:#555;margin-bottom:6px">توقيع العميل / Customer Signature:</p>
    <img src="${order.signature_data}" style="max-width:220px;height:auto;border:1px solid #d1fae5;border-radius:8px;background:#fff;padding:4px;display:block;margin:0 auto"/>
  </div>` : ''}
  ${order.signed_by ? `
  <div style="margin-top:12px;padding-top:10px;border-top:1px dashed #86efac;text-align:center">
    <p style="font-size:11px;color:#555;margin-bottom:4px">توقيع العميل / Customer Signature:</p>
    <p style="font-size:22px;font-family:Georgia,serif;font-style:italic;color:#15803d">${order.signed_by}</p>
  </div>` : ''}
</div>` : `
<div class="pending-box">⏳ بانتظار موافقة العميل / Pending Customer Approval</div>`}

<div class="footer">
  <span>سندك — قطر / SNDK — Qatar</span>
  <span>${new Date().toLocaleDateString('ar-QA')}</span>
</div>
</body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

const showBrowserNotif = (title, body) => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico', dir: 'rtl' });
  }
};
const requestNotifPerm = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

function MyOrdersView({ lang, tr, isRtl, user, profile, onCountChange, theme }) {
  const [tab, setTab]           = useState('appts');
  const [appts, setAppts]       = useState([]);
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [openVideoId, setOpenVideoId] = useState(null);
  const seenIdsRef = useRef(new Set());

  const APPT_ST = {
    pending:     { label:tr.apptPending,     bg:'rgba(138,21,56,0.18)',   text:'#8A1538' },
    confirmed:   { label:tr.apptConfirmed,   bg:'rgba(59,130,246,0.15)',  text:'#60a5fa' },
    in_progress: { label:tr.apptInProgress,  bg:'rgba(249,115,22,0.15)',  text:'#f97316' },
    completed:   { label:tr.apptCompleted,   bg:'rgba(34,197,94,0.15)',   text:'#22c55e' },
    cancelled:   { label:tr.apptCancelled,   bg:'rgba(239,68,68,0.15)',   text:'#ef4444' },
  };
  const ORDER_ST = {
    draft:     { label:tr.ordStDraft,     bg:'rgba(100,116,139,0.2)', text:'#94a3b8' },
    pending:   { label:tr.ordStPending,   bg:'rgba(59,130,246,0.15)', text:'#60a5fa' },
    sourcing:  { label:tr.ordStSourcing,  bg:'rgba(234,179,8,0.15)',  text:'#eab308' },
    ready:     { label:tr.ordStReady,     bg:'rgba(34,197,94,0.15)',  text:'#22c55e' },
    delivered: { label:tr.ordStDelivered, bg:'rgba(168,85,247,0.15)', text:'#a855f7' },
    cancelled: { label:tr.ordStCancelled, bg:'rgba(239,68,68,0.15)',  text:'#ef4444' },
  };

  const loadData = async () => {
    if (!user) { setLoading(false); return; }
    const { data: apptData } = await supabase.from('appointments')
      .select('*, cars(car_type, car_category, production_year, plate_number, chassis_number), job_cards(id, job_number, job_status, customer_complaints, work_done, mileage_in, mileage_out, reception_video_url, reception_videos)')
      .eq('profile_id', user.id)
      .order('appointment_date', { ascending: false });
    setAppts(apptData || []);
    if (apptData?.length) {
      const ids = apptData.map(a => a.id);
      const { data: ordData } = await supabase
        .from('orders').select('*, order_items(*), payments(*)')
        .in('appointment_id', ids).order('created_at', { ascending: false });
      const loaded = ordData || [];
      setOrders(loaded);
      // init seen set with already-known ids (no notification for existing on first load)
      if (seenIdsRef.current.size === 0) {
        loaded.filter(o => o.sent_to_customer).forEach(o => seenIdsRef.current.add(o.id));
      }
      // auto-switch to orders tab if there are any active orders
      if (loaded.some(o => o.sent_to_customer)) setTab('orders');
      const pending = loaded.filter(o => o.sent_to_customer && !o.customer_approved && !o.customer_rejected).length;
      onCountChange?.(pending);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    requestNotifPerm();
    loadData();
  }, [user]);

  // Poll every 20s for new quotations while view is open
  useEffect(() => {
    if (!user) return;
    const id = setInterval(async () => {
      const { data: apptData } = await supabase.from('appointments')
        .select('id').eq('profile_id', user.id);
      if (!apptData?.length) return;
      const ids = apptData.map(a => a.id);
      const { data: ordData } = await supabase.from('orders')
        .select('*, order_items(*)')
        .in('appointment_id', ids)
        .eq('sent_to_customer', true);
      if (!ordData) return;
      // detect newly sent quotations
      ordData.forEach(o => {
        if (!seenIdsRef.current.has(o.id)) {
          seenIdsRef.current.add(o.id);
          showBrowserNotif(
            isRtl ? '📋 وصلك عرض سعر جديد!' : '📋 New Quotation!',
            isRtl ? 'راجع الطلبات وأعطِ موافقتك على عرض السعر.' : 'Check your orders and approve the quotation.'
          );
        }
      });
      setOrders(prev => {
        const updated = [...prev];
        ordData.forEach(newOrd => {
          const idx = updated.findIndex(o => o.id === newOrd.id);
          if (idx >= 0) updated[idx] = newOrd; else updated.push(newOrd);
        });
        return updated;
      });
      const pending = ordData.filter(o => !o.customer_approved && !o.customer_rejected).length;
      onCountChange?.(pending);
    }, 20000);
    return () => clearInterval(id);
  }, [user, isRtl]);

  const requestPayment = async (orderId, type) => {
    const { error } = await supabase.rpc('request_payment', { p_order_id: orderId, p_type: type });
    if (error) { alert('خطأ: ' + error.message); return; }
    const field = type === 'parts' ? 'parts_payment_status' : 'labor_payment_status';
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, [field]: 'pending' } : o));
  };

  const serviceKeysOf = (order) => {
    const seen = new Set();
    const keys = [];
    (order?.order_items || []).forEach(i => {
      const key = i.service_name?.ar || i.service_name?.en;
      if (key && !seen.has(key)) { seen.add(key); keys.push(key); }
    });
    return keys;
  };

  const toggleServiceSelection = (orderId, key) => {
    const order = orders.find(o => o.id === orderId);
    const allKeys = serviceKeysOf(order);
    setServiceSelections(prev => {
      const current = prev[orderId] || Object.fromEntries(allKeys.map(k=>[k,true]));
      return { ...prev, [orderId]: { ...current, [key]: !current[key] } };
    });
  };
  const setAllServiceSelection = (orderId, value) => {
    const order = orders.find(o => o.id === orderId);
    const allKeys = serviceKeysOf(order);
    setServiceSelections(prev => ({ ...prev, [orderId]: Object.fromEntries(allKeys.map(k=>[k,value])) }));
  };
  const isServiceSelected = (orderId, key) => {
    const current = serviceSelections[orderId];
    if (!current || current[key] === undefined) return true; // default: selected
    return current[key];
  };

  const approveWithSignature = async (sigData, sigName) => {
    const orderId = sigModal.orderId;
    if (!orderId) return;
    const now = new Date().toISOString();
    const order = orders.find(o => o.id === orderId);
    const serviceKeys = serviceKeysOf(order);
    const selection = serviceSelections[orderId] || {};
    const decisions = {};
    serviceKeys.forEach(key => { decisions[key] = (selection[key] !== false) ? 'approved' : 'rejected'; });
    const approvedCount = Object.values(decisions).filter(d => d === 'approved').length;
    // A quotation with no service groups (legacy / general-only) is a simple whole-order approval
    const isApproved = serviceKeys.length === 0 ? true : approvedCount > 0;
    const isRejected = serviceKeys.length === 0 ? false : approvedCount === 0;

    const { error: decErr } = await supabase.from('orders').update({
      customer_approved: isApproved, customer_rejected: isRejected, approved_at: now,
      service_decisions: decisions,
    }).eq('id', orderId);
    if (decErr) {
      alert(isRtl ? 'خطأ في حفظ القرار: ' + decErr.message : 'Error saving decision: ' + decErr.message);
      return;
    }

    const localSig = {};
    if (sigData || sigName) {
      const sigUpdate = {};
      if (sigData) sigUpdate.signature_data = sigData;
      if (sigName) sigUpdate.signed_by      = sigName;
      const { error: sigErr } = await supabase.from('orders').update(sigUpdate).eq('id', orderId);
      if (sigErr) {
        alert(isRtl ? 'تم حفظ القرار لكن لم يُحفظ التوقيع — ربما الأعمدة غير موجودة بعد في قاعدة البيانات.' : 'Decision saved but signature failed — columns may be missing.');
      } else {
        if (sigData) localSig.signature_data = sigData;
        if (sigName) localSig.signed_by = sigName;
      }
    }

    setOrders(prev => prev.map(o => o.id === orderId
      ? { ...o, customer_approved:isApproved, customer_rejected:isRejected, approved_at:now, service_decisions:decisions, ...localSig }
      : o
    ));
    setSigModal({ open:false, orderId:null });
  };

  const cancelAppt = async (appt) => {
    if (!window.confirm(tr.apptCancelConfirm)) return;
    setCancellingId(appt.id);
    const { error } = await supabase.from('appointments').update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'customer',
    }).eq('id', appt.id);
    if (error) { alert(isRtl ? 'خطأ: ' + error.message : 'Error: ' + error.message); }
    else { setAppts(prev => prev.map(a => a.id === appt.id ? { ...a, status: 'cancelled' } : a)); }
    setCancellingId(null);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
        <Lock size={44} style={{ color:C.gold, opacity:0.4 }}/>
        <p className="text-base font-semibold text-center" style={{ color:C.muted }}>{tr.ordSignIn}</p>
      </div>
    );
  }

  const apptMap       = Object.fromEntries(appts.map(a => [a.id, a]));
  const orderByApptId = Object.fromEntries(orders.map(o => [o.appointment_id, o]));
  const [sigModal, setSigModal] = useState({ open:false, orderId:null });
  const [serviceSelections, setServiceSelections] = useState({}); // { [orderId]: { [serviceKey]: boolean } }

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-3xl md:mx-auto">
      <h1 className="text-2xl font-black" style={{ color:C.gold }}>{tr.myOrders}</h1>

      {/* Tabs */}
      <div className="grid grid-cols-2 rounded-2xl overflow-hidden" style={{ border:`1px solid ${C.border}` }}>
        {[{ key:'appts',  label: isRtl ? 'المواعيد' : 'Appointments', icon:Calendar },
          { key:'orders', label: isRtl ? 'الطلبات'  : 'My Orders',    icon:ClipboardList }].map(item => (
          <button key={item.key} onClick={() => setTab(item.key)}
            className="flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all"
            style={tab===item.key
              ? { background:CARD_BG_CYCLE[0].bg, color:CARD_BG_CYCLE[0].txt }
              : { background:CARD_BG_CYCLE[1].bg, color:CARD_BG_CYCLE[1].txt }}>
            <item.icon size={14}/>{item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2" style={{ color:C.muted }}>
          <Loader2 size={20} className="animate-spin"/><span>{tr.ordLoading}</span>
        </div>
      ) : (
        <>
          {/* ── قسم 1: المواعيد (بدون أمر شغل) ── */}
          {tab==='appts' && (() => {
            const noJcAppts = appts.filter(a => !a.job_cards?.length);
            return (
              <div className="space-y-3">
                {noJcAppts.length === 0 ? (
                  <div className="py-16 text-center space-y-3" style={{ color:C.muted }}>
                    <Calendar size={44} className="mx-auto opacity-25"/>
                    <p className="text-sm">{isRtl ? 'لا توجد مواعيد بانتظار الاستقبال' : 'No pending appointments'}</p>
                    {appts.filter(a => a.job_cards?.length > 0).length > 0 && (
                      <button onClick={() => setTab('orders')}
                        className="text-xs font-bold px-4 py-2 rounded-xl border transition-all"
                        style={{ borderColor:C.gold, color:C.gold, background:`${C.gold}10` }}>
                        {isRtl ? 'عرض الطلبات الجارية ←' : 'View active orders →'}
                      </button>
                    )}
                  </div>
                ) : noJcAppts.map((a, ai) => {
                  const cc  = CARD_BG_CYCLE[ai % 2];
                  const car = a.cars;
                  const st  = APPT_ST[a.status] || APPT_ST.pending;
                  return (
                    <div key={a.id} className="rounded-2xl p-4 space-y-3"
                      style={{ background:cc.bg, border:`1px solid ${a.status==='cancelled'?'rgba(239,68,68,0.4)':cc.fg+'40'}` }}>
                      {/* Service + status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {(() => {
                            const svcs = parseServices(a.service_type);
                            return svcs ? (
                              <div className="flex flex-wrap gap-1.5">
                                {svcs.map((s, i) => (
                                  <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                    style={{ background:'rgba(0,0,0,0.12)', color:cc.txt, border:`1px solid ${cc.fg}40` }}>
                                    {s.name || s}
                                  </span>
                                ))}
                              </div>
                            ) : <p className="font-bold text-sm" style={{ color:cc.txt }}>{a.service_type||'—'}</p>;
                          })()}
                          {car && (
                            <p className="text-xs mt-1.5" style={{ color:cc.sub }}>
                              {[car.car_type, car.car_category, car.production_year].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                          style={{ background:st.bg, color:st.text }}>
                          {st.label}
                        </span>
                      </div>
                      {/* Date */}
                      {(a.appointment_date || a.appointment_time) && (
                        <div className="flex items-center gap-2 text-xs" style={{ color:cc.sub }}>
                          <Calendar size={11}/>
                          <span>{a.appointment_date}</span>
                          {a.appointment_time && <span style={{ color:cc.sub }}>· {a.appointment_time}</span>}
                        </div>
                      )}
                      {a.customer_notes && <p className="text-xs italic" style={{ color:cc.sub }}>{a.customer_notes}</p>}
                      {/* Cancel button (only if not cancelled and no job card) */}
                      {a.status !== 'cancelled' && a.status !== 'completed' && (
                        <div className="pt-1">
                          <button onClick={() => cancelAppt(a)} disabled={cancellingId === a.id}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all disabled:opacity-50"
                            style={{ borderColor:'rgba(239,68,68,0.4)', color:'#ef4444', background:'rgba(239,68,68,0.12)' }}>
                            {cancellingId === a.id ? <Loader2 size={11} className="animate-spin"/> : <X size={11}/>}
                            {tr.apptCancelBtn}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ── قسم 2: الطلبات (مواعيد عندها أمر شغل) ── */}
          {tab==='orders' && (() => {
            const jcAppts = appts.filter(a => a.job_cards?.length > 0);
            return (
              <div className="space-y-3">
                {jcAppts.length === 0 ? (
                  <div className="py-16 text-center space-y-2" style={{ color:C.muted }}>
                    <ClipboardList size={44} className="mx-auto opacity-25"/>
                    <p className="text-sm">{isRtl ? 'لا توجد طلبات حتى الآن' : 'No orders yet'}</p>
                  </div>
                ) : jcAppts.map((a, ai) => {
                  const cc     = CARD_BG_CYCLE[1]; // always maroon
                  const jc     = a.job_cards[0];
                  const car    = a.cars;
                  const relOrd = orderByApptId[a.id];
                  const jcColor = JC_STATUS_COLOR[jc.job_status] || '#94a3b8';
                  const jcLabel = tr[`jc_${jc.job_status}`] || jc.job_status;
                  const gt      = relOrd ? (Number(relOrd.total_parts_price)||0)+(Number(relOrd.total_labor_price)||0) : 0;
                  return (
                    <div key={a.id} className="rounded-2xl overflow-hidden"
                      style={{ background:cc.bg, border:`1px solid ${cc.fg}30` }}>

                      {/* ── Header ── */}
                      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3"
                        style={{ borderBottom:`1px solid ${cc.div}` }}>
                        <div className="flex-1 min-w-0">
                          {(() => {
                            const svcs = parseServices(a.service_type);
                            return svcs ? (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {svcs.map((s, i) => (
                                  <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                    style={{ background:'rgba(0,0,0,0.10)', color:cc.txt }}>
                                    {s.name || s}
                                  </span>
                                ))}
                              </div>
                            ) : <p className="text-sm font-bold mb-0.5" style={{ color:cc.txt }}>{a.service_type||'—'}</p>;
                          })()}
                          {car && (
                            <p className="text-xs" style={{ color:cc.sub }}>
                              {[car.car_type, car.car_category, car.production_year].filter(Boolean).join(' · ')}
                              {car.plate_number ? ` · ${car.plate_number}` : ''}
                            </p>
                          )}
                          {a.appointment_date && (
                            <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color:cc.sub }}>
                              <Calendar size={9}/>{a.appointment_date}
                            </p>
                          )}
                        </div>
                        {/* Job status + number */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background:jcColor }}>
                            {jcLabel}
                          </span>
                          <span className="text-[10px] font-mono" style={{ color:cc.sub }}>{jc.job_number}</span>
                        </div>
                      </div>

                      {/* ── فيديوهات استلام السيارة ── */}
                      {(() => {
                        let videos = [];
                        try { videos = JSON.parse(jc.reception_videos || '[]'); } catch {}
                        if (!videos.length && jc.reception_video_url) videos = [jc.reception_video_url];
                        if (!videos.length) return null;
                        return (
                          <div className="px-4 pt-3 space-y-2">
                            {videos.map((url, idx) => (
                              <div key={idx}>
                                <button onClick={() => setOpenVideoId(id => id === `${jc.id}-${idx}` ? null : `${jc.id}-${idx}`)}
                                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                                  style={{ background:'rgba(0,0,0,0.10)', border:`1px solid ${cc.fg}50`, color:cc.txt }}>
                                  🎥 {isRtl ? `فيديو الاستلام ${idx + 1}` : `Reception Video ${idx + 1}`}
                                </button>
                                {openVideoId === `${jc.id}-${idx}` && (
                                  <video src={url} controls autoPlay className="w-full rounded-xl mt-1" style={{ maxHeight:220 }}/>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {/* ── عرض السعر + موافقة ── */}
                      {relOrd?.sent_to_customer ? (
                        <div className="p-4 space-y-3">
                          {/* Requested services + priority + approve/reject selection */}
                          {(() => {
                            const PRIORITY_STYLE = {
                              high:   { label: isRtl?'أولوية قصوى':'Critical', bg:'#dc2626', text:'#ffffff' },
                              medium: { label: isRtl?'أولوية متوسطة':'Medium', bg:'#f97316', text:'#ffffff' },
                              low:    { label: isRtl?'أولوية منخفضة':'Low',    bg:'#eab308', text:'#1c1300' },
                            };
                            const seen = new Set();
                            const services = [];
                            (relOrd.order_items || []).forEach(i => {
                              const key = i.service_name?.ar || i.service_name?.en;
                              if (key && !seen.has(key)) {
                                seen.add(key);
                                services.push({
                                  key, name_ar: i.service_name.ar, name_en: i.service_name.en, priority: i.service_name.priority || 'low',
                                  category_ar: i.service_name.category_ar || '', category_en: i.service_name.category_en || '', notes: i.service_name.notes || '',
                                });
                              }
                            });
                            if (services.length === 0) return null;
                            const order = { high:0, medium:1, low:2 };
                            services.sort((a,b)=>order[a.priority]-order[b.priority]);
                            const decided = relOrd.customer_approved || relOrd.customer_rejected;
                            return (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold" style={{ color:cc.sub }}>{isRtl?'الخدمات المطلوبة:':'Requested Services:'}</p>
                                  {!decided && services.length > 1 && (
                                    <div className="flex items-center gap-2">
                                      <button onClick={()=>setAllServiceSelection(relOrd.id, true)} className="text-[10px] font-bold underline" style={{ color:cc.fg }}>{isRtl?'تحديد الكل':'Select all'}</button>
                                      <button onClick={()=>setAllServiceSelection(relOrd.id, false)} className="text-[10px] font-bold underline" style={{ color:cc.sub }}>{isRtl?'إلغاء الكل':'Deselect all'}</button>
                                    </div>
                                  )}
                                </div>
                                {services.map(s => {
                                  const selected = isServiceSelected(relOrd.id, s.key);
                                  const decision = relOrd.service_decisions?.[s.key];
                                  return (
                                    <div key={s.key} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background:'rgba(0,0,0,0.08)' }}>
                                      {!decided && (
                                        <button onClick={()=>toggleServiceSelection(relOrd.id, s.key)}
                                          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                                          style={{ background: selected ? '#16a34a' : 'transparent', border:`2px solid ${selected ? '#16a34a' : cc.sub}` }}>
                                          {selected && <Check size={12} color="#fff"/>}
                                        </button>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        {(s.category_ar || s.category_en) && (
                                          <p className="text-[9px] font-bold uppercase tracking-wider truncate" style={{ color:cc.sub }}>{isRtl?(s.category_ar||s.category_en):(s.category_en||s.category_ar)}</p>
                                        )}
                                        <span className="text-xs font-semibold" style={{ color:cc.txt }}>{isRtl?(s.name_ar||s.name_en):(s.name_en||s.name_ar)}</span>
                                        {s.notes && <p className="text-[10px] mt-0.5 italic" style={{ color:cc.sub }}>{s.notes}</p>}
                                      </div>
                                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:PRIORITY_STYLE[s.priority].bg, color:PRIORITY_STYLE[s.priority].text }}>
                                          {PRIORITY_STYLE[s.priority].label}
                                        </span>
                                        {decision && (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={decision==='approved' ? { background:'rgba(34,197,94,0.15)', color:'#22c55e' } : { background:'rgba(239,68,68,0.15)', color:'#ef4444' }}>
                                            {decision==='approved' ? (isRtl?'تمت الموافقة':'Approved') : (isRtl?'تم الرفض':'Rejected')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                          {/* PDF */}
                          <button onClick={() => openQuotationPDF(relOrd, a, profile, jc)}
                            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                            style={{ background:'rgba(0,0,0,0.10)', border:`1px solid ${cc.fg}50`, color:cc.txt }}>
                            <FileImage size={14}/>{isRtl ? 'فتح أمر الشغل PDF' : 'Open Job Card PDF'}
                          </button>
                          {/* Total */}
                          {gt > 0 && (
                            <div className="flex items-center justify-between px-1">
                              <span className="text-xs" style={{ color:cc.sub }}>{isRtl ? 'إجمالي عرض السعر:' : 'Quotation Total:'}</span>
                              <span className="text-base font-black" style={{ color:cc.fg }}>{gt.toFixed(3)} {isRtl ? 'ر.ق' : 'QAR'}</span>
                            </div>
                          )}
                          {/* Paid / Remaining */}
                          {gt > 0 && (() => {
                            const paid = (relOrd.payments || []).reduce((s,p)=>s+Number(p.amount||0),0);
                            if (paid <= 0) return null;
                            const remaining = gt - paid;
                            return (
                              <div className="rounded-xl px-3 py-2 space-y-1" style={{ background:'rgba(0,0,0,0.08)' }}>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs" style={{ color:cc.sub }}>{isRtl ? 'المدفوع:' : 'Paid:'}</span>
                                  <span className="text-sm font-bold" style={{ color:'#22c55e' }}>{paid.toFixed(3)} {isRtl ? 'ر.ق' : 'QAR'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs" style={{ color:cc.sub }}>{isRtl ? 'المتبقي:' : 'Remaining:'}</span>
                                  <span className="text-sm font-bold" style={{ color: remaining < -0.001 ? '#ef4444' : remaining > 0.001 ? cc.fg : '#22c55e' }}>{remaining.toFixed(3)} {isRtl ? 'ر.ق' : 'QAR'}</span>
                                </div>
                              </div>
                            );
                          })()}
                          {/* Confirm decision */}
                          {!relOrd.customer_approved && !relOrd.customer_rejected && (
                            <button onClick={() => setSigModal({ open:true, orderId:relOrd.id })}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all active:scale-95"
                              style={{ background:'#16a34a', color:'#fff' }}>
                              <Check size={15}/>{isRtl ? 'تأكيد القرار والتوقيع' : 'Confirm Decision & Sign'}
                            </button>
                          )}
                          {/* Approved summary + signature */}
                          {relOrd.customer_approved && (() => {
                            const decisions = relOrd.service_decisions || {};
                            const total = Object.keys(decisions).length;
                            const approvedN = Object.values(decisions).filter(d=>d==='approved').length;
                            const allApproved = total === 0 || approvedN === total;
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                                  style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)' }}>
                                  <CheckCircle2 size={14} style={{ color:'#22c55e' }}/>
                                  <span className="text-sm font-bold" style={{ color:'#22c55e' }}>
                                    {allApproved
                                      ? (isRtl ? 'تمت الموافقة على كل الخدمات ✅' : 'All services approved ✅')
                                      : (isRtl ? `تمت الموافقة على ${approvedN} من ${total} خدمات، وتم رفض الباقي` : `Approved ${approvedN} of ${total} services, rest rejected`)}
                                  </span>
                                </div>
                                {relOrd.signature_data && (
                                  <div className="px-2 py-2 rounded-xl" style={{ background:`${C.gold}08`, border:`1px solid ${C.gold}20` }}>
                                    <p className="text-[10px] font-bold mb-1.5" style={{ color:C.dim }}>{isRtl ? 'توقيعك:' : 'Your signature:'}</p>
                                    <img src={relOrd.signature_data} alt="sig"
                                      style={{ maxWidth:180, height:'auto', background:'#fff', padding:3, borderRadius:8, border:`1px solid ${C.border}`, display:'block' }}/>
                                  </div>
                                )}
                                {relOrd.signed_by && !relOrd.signature_data && (
                                  <div className="px-3 py-2 rounded-xl" style={{ background:`${C.gold}08`, border:`1px solid ${C.gold}20` }}>
                                    <p className="text-[10px] font-bold mb-1" style={{ color:C.dim }}>{isRtl ? 'توقيعك:' : 'Your signature:'}</p>
                                    <p style={{ fontFamily:'Georgia,serif', fontStyle:'italic', fontSize:20, color:C.text }}>{relOrd.signed_by}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          {/* Rejected badge */}
                          {relOrd.customer_rejected && !relOrd.customer_approved && (
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                              style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)' }}>
                              <X size={14} style={{ color:'#ef4444' }}/>
                              <span className="text-xs font-bold" style={{ color:'#ef4444' }}>{isRtl ? 'تم رفض كل الخدمات — بانتظار مراجعة الفريق' : 'All services rejected — awaiting review'}</span>
                            </div>
                          )}
                        </div>
                      ) : null}

                      {/* ── الدفع (قطع أولاً ثم شغل اليد) ── */}
                      {relOrd && (
                        <div style={{ borderTop:`1px solid ${C.border}` }}>
                          {Number(relOrd.total_parts_price) > 0 && (
                            <PaymentRow
                              label={isRtl ? 'قطع الغيار' : 'Parts'}
                              amount={Number(relOrd.total_parts_price)}
                              status={relOrd.parts_payment_status || 'unpaid'}
                              canPay={relOrd.customer_approved && relOrd.status !== 'draft'}
                              onPay={() => requestPayment(relOrd.id, 'parts')}
                              tr={tr} isRtl={isRtl} cc={cc}
                            />
                          )}
                          {Number(relOrd.total_labor_price) > 0 && (
                            <PaymentRow
                              label={isRtl ? 'شغل اليد' : 'Labor'}
                              amount={Number(relOrd.total_labor_price)}
                              status={relOrd.labor_payment_status || 'unpaid'}
                              canPay={['ready','delivered','completed'].includes(relOrd.status) && (relOrd.parts_payment_status||'paid')==='paid'}
                              disabledHint={isRtl ? 'متاح بعد انتهاء الإصلاح ودفع القطع' : 'Available after repair & parts paid'}
                              onPay={() => requestPayment(relOrd.id, 'labor')}
                              tr={tr} isRtl={isRtl} cc={cc}
                            />
                          )}
                        </div>
                      )}

                      {/* placeholder for spacing if no quotation yet */}
                      {!relOrd?.sent_to_customer && (
                        <div className="px-4 py-3 flex items-center gap-2" style={{ color:C.gold }}>
                          <Loader2 size={12} className="animate-spin"/>
                          <span className="text-xs font-bold">{isRtl ? 'جاري إعداد عرض السعر...' : 'Preparing quotation...'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </>
      )}

      {sigModal.open && (
        <SignatureModal
          isRtl={isRtl}
          theme={theme}
          onConfirm={approveWithSignature}
          onClose={() => setSigModal({ open:false, orderId:null })}
        />
      )}
    </div>
  );
}

// ── HOME VIEW ──────────────────────────────────────────────────────────
// ── Announcement preset styles (must match admin ANN_PRESETS) ────────────
const ANN_PRESETS = {
  egypt:  { bg:'linear-gradient(180deg,#CE1126 33.33%,#FFFFFF 33.33% 66.67%,#000000 66.67%)', overlay:'rgba(0,0,0,0.48)', shadow:'rgba(206,17,38,0.45)' },
  qatar:  { bg:'linear-gradient(90deg,#8D1B3D 80%,#FFFFFF 80%)',                              overlay:'rgba(0,0,0,0.45)', shadow:'rgba(141,27,61,0.5)'  },
  maroon: { bg:'linear-gradient(135deg,#8A1538 0%,#3D0818 100%)',                              overlay:'rgba(0,0,0,0.18)', shadow:'rgba(114,47,55,0.45)' },
  gold:   { bg:'linear-gradient(135deg,#B8860B 0%,#7A5C0A 100%)',                              overlay:'rgba(0,0,0,0.3)',  shadow:'rgba(184,134,11,0.5)' },
  blue:   { bg:'linear-gradient(135deg,#1e3a8a 0%,#1e40af 100%)',                              overlay:'rgba(0,0,0,0.3)',  shadow:'rgba(30,58,138,0.5)'  },
  green:  { bg:'linear-gradient(135deg,#14532d 0%,#166534 100%)',                              overlay:'rgba(0,0,0,0.3)',  shadow:'rgba(20,83,45,0.5)'   },
  purple: { bg:'linear-gradient(135deg,#4c1d95 0%,#5b21b6 100%)',                              overlay:'rgba(0,0,0,0.3)',  shadow:'rgba(76,29,149,0.5)'  },
};

function HomeView({ lang, tr, setFormData, isRtl, onBookNow, goServices, serviceCategories, homeAnnouncements, user, goOrders, pendingQuotCount }) {
  const cats = serviceCategories.map(enrichCat);
  const goToCat = (cat) => {
    setFormData(p => ({ ...p, serviceKey: cat.id, serviceName: cat.ar }));
    goServices?.();
  };

  // Slideshow state
  const [annIdx, setAnnIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (homeAnnouncements.length <= 1) { setAnnIdx(0); return; }
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setAnnIdx(i => (i + 1) % homeAnnouncements.length);
        setFading(false);
      }, 350);
    }, 30000);
    return () => clearInterval(timer);
  }, [homeAnnouncements.length]);

  const goSlide = (i) => {
    if (i === annIdx) return;
    setFading(true);
    setTimeout(() => { setAnnIdx(i); setFading(false); }, 350);
  };

  const ann = homeAnnouncements[annIdx] || null;
  const annStyle = ann ? (ANN_PRESETS[ann.style] || ANN_PRESETS.maroon) : null;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl md:mx-auto">
      <div className="relative rounded-2xl overflow-hidden p-6 md:p-8 min-h-[150px] md:min-h-[190px] flex flex-col justify-between"
        style={{
          ...(!ann?.video_url && ann?.image_url
            ? { backgroundImage:`url(${ann.image_url})`, backgroundSize:'cover', backgroundPosition:'center' }
            : { background: ann?.video_url ? '#000' : (annStyle ? annStyle.bg : C.heroBg) }),
          border: `1px solid ${annStyle ? 'rgba(255,255,255,0.18)' : `${C.gold}30`}`,
          boxShadow: `0 0 48px ${annStyle ? annStyle.shadow : C.heroShadow}`,
          transition: 'box-shadow 0.35s ease',
        }}>
        {/* Video background */}
        {ann?.video_url && (
          <video key={ann.video_url} src={ann.video_url}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            autoPlay muted loop playsInline/>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: (ann?.video_url || ann?.image_url) ? 'rgba(0,0,0,0.52)' : (annStyle ? annStyle.overlay : C.heroOverlay(isRtl)) }}/>

        {/* Fading content layer */}
        <div className="contents" style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.35s ease' }}>
          {/* Decorative watermark */}
          {ann
            ? <div className="absolute bottom-0 end-0 text-[170px] leading-none opacity-15 pointer-events-none select-none -mb-4 -me-4">{ann.emoji}</div>
            : <div className="absolute bottom-0 end-0 -mb-4 -me-4 opacity-10 pointer-events-none"><Car size={200} color="#FFCB74"/></div>
          }
          {/* Main text */}
          <div className="relative">
            {ann ? (
              <>
                <p className="text-[10px] font-black uppercase tracking-[3px] mb-2" style={{ color:'rgba(255,203,116,0.85)' }}>
                  {lang==='ar' ? '📢 إعلان' : '📢 ANNOUNCEMENT'}
                </p>
                <h1 className="text-white font-black text-2xl md:text-3xl leading-snug drop-shadow-lg">
                  {lang==='ar' ? ann.text_ar : (ann.text_en || ann.text_ar)}
                </h1>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ color:`${C.gold}90` }}>QATAR · VIP</p>
                <h1 className="text-white font-black text-2xl md:text-3xl leading-tight">{tr.greeting}</h1>
                <p className="text-sm mt-1" style={{ color:'rgba(246,246,246,0.60)' }}>{tr.greetingSub}</p>
              </>
            )}
          </div>
        </div>

        {/* Buttons + dots */}
        <div className="relative flex items-end justify-between mt-5">
          <div className="flex gap-3">
            <button onClick={()=>onBookNow()}
              className="px-6 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95 hover:scale-[1.06] hover:brightness-110"
              style={{ background:C.gold, color:C.btnTxt, boxShadow:`0 0 24px ${C.gold}60` }}>
              {tr.bookNow}
            </button>
            <button onClick={goServices}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 hover:scale-[1.06]"
              style={{ border:`1px solid rgba(255,255,255,0.3)`, color:'#fff' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.15)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='';}}>
              {tr.allServices}
            </button>
          </div>
          {/* Slide dots */}
          {homeAnnouncements.length > 1 && (
            <div className="flex items-center gap-1.5 pb-0.5">
              {homeAnnouncements.map((_, i) => (
                <button key={i} onClick={() => goSlide(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    background: i === annIdx ? '#fff' : 'rgba(255,255,255,0.4)',
                    width: i === annIdx ? '18px' : '6px',
                    height: '6px',
                  }}/>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orders notification banner */}
      {user && pendingQuotCount > 0 && (
        <button onClick={goOrders}
          className="w-full rounded-2xl px-5 py-4 flex items-center gap-3 transition-all active:scale-[0.98] text-start"
          style={{ background:'rgba(138,21,56,0.10)', border:'1.5px solid rgba(138,21,56,0.35)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background:'rgba(138,21,56,0.18)' }}>
            <ClipboardList size={20} style={{ color:'#8A1538' }}/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm" style={{ color:'#8A1538' }}>
              {isRtl
                ? `عندك ${pendingQuotCount} طلب ينتظر موافقتك`
                : `${pendingQuotCount} order awaiting your approval`}
            </p>
            <p className="text-xs mt-0.5" style={{ color:'rgba(138,21,56,0.65)' }}>
              {isRtl ? 'اضغط لمراجعة عرض السعر' : 'Tap to review the quotation'}
            </p>
          </div>
          {isRtl ? <ChevronLeft size={18} style={{ color:'#8A1538', flexShrink:0 }}/> : <ChevronRight size={18} style={{ color:'#8A1538', flexShrink:0 }}/>}
        </button>
      )}

      {cats.length > 0 && (
        <div>
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color:C.muted }}>{tr.ourServices}</p>
          <div className="grid grid-cols-3 gap-2.5 md:hidden grid-flow-dense">
            {cats.map(s=>(
              <ServiceCard key={s.key} service={s} lang={lang} span={s.span} onClick={()=>goToCat(s)}/>
            ))}
          </div>
          <div className="hidden md:grid md:grid-cols-3 gap-4">
            {cats.map(s=>(
              <ServiceCard key={s.key} service={s} lang={lang} span={1} onClick={()=>goToCat(s)}/>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SERVICES VIEW ──────────────────────────────────────────────────────
function ServicesView({ lang, tr, isRtl, expanded, setExpanded, serviceCategories, allSubServices, cart, addToCart, removeFromCart, theme }) {
  const btnAccent = theme === 'light' ? '#8A1538' : C.gold;
  const loading = serviceCategories.length === 0;

  return (
    <div className="relative">
      <div className="p-4 md:p-8 max-w-3xl md:mx-auto space-y-4" style={{ paddingBottom: '24px' }}>
        <div className="mb-2">
          <h1 className={`text-2xl font-black ${C.selectCls}`}>{tr.allServices}</h1>
          <p className="text-sm mt-1" style={{ color:C.muted }}>{tr.browseFreely}</p>
          <div className="w-10 h-0.5 rounded-full mt-2" style={{ background:`${C.gold}70` }}/>
        </div>

        {loading ? (
          <div className="flex justify-center py-12" style={{ color:C.gold }}>
            <Loader2 size={24} className="animate-spin"/>
          </div>
        ) : serviceCategories.map((cat, catIdx) => {
          const iconStyle = CAT_STYLE[cat.name?.ar] || CAT_STYLE[cat.name?.en] || DEFAULT_CAT_STYLES[catIdx % DEFAULT_CAT_STYLES.length];
          const cc     = CARD_BG_CYCLE[catIdx % 2];
          const iconCC = CARD_BG_CYCLE[(catIdx + 1) % 2];
          const Icon   = iconStyle.icon;
          const isOpen = expanded === cat.id;
          const subs   = allSubServices.filter(s => s.category_id === cat.id);
          const catName = cat.name?.[lang] || cat.name?.ar || '';
          const catInCartCount = cart.filter(x => x.catId === cat.id).length;
          return (
            <div key={cat.id} className="rounded-2xl overflow-hidden transition-all" style={{ background:cc.bg, border:`1px solid ${isOpen?`${cc.fg}50`:`${cc.fg}25`}` }}>
              <button onClick={()=>setExpanded(isOpen?null:cat.id)}
                className="w-full flex items-center gap-4 p-4 transition-all"
                style={{ borderBottom:isOpen?`1px solid ${cc.div}`:'none' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:iconCC.bg }}>
                  <Icon size={22} style={{ color:iconCC.fg }}/>
                </div>
                <div className="flex-1 text-start">
                  <p className="font-black text-base" style={{ color:cc.txt }}>{catName}</p>
                  <p className="text-xs mt-0.5" style={{ color:cc.sub }}>
                    {subs.length} {isRtl?'خدمة فرعية':'sub-services'}
                    {catInCartCount > 0 && <span style={{ color:cc.fg }}> · {catInCartCount} {isRtl?'مضافة':'added'}</span>}
                  </p>
                </div>
                <div className="transition-transform" style={{ transform:isOpen?'rotate(90deg)':'', color:cc.sub }}>
                  {isRtl?<ChevronLeft size={18}/>:<ChevronRight size={18}/>}
                </div>
              </button>

              {isOpen && (
                <div style={{ background: C.panel, borderTop:`1px solid ${C.border}` }}>
                  {subs.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-center" style={{ color:C.muted }}>
                      {isRtl ? 'لا توجد خدمات متاحة حالياً' : 'No services available yet'}
                    </p>
                  ) : (
                    <div className="divide-y" style={{ borderColor:C.border }}>
                      {subs.map((sub, i) => {
                        const inCart = cart.some(x => x.id === sub.id);
                        const subName = sub.name?.[lang] || sub.name?.ar || '';
                        return (
                          <div key={sub.id} className="px-4 py-3.5 gap-3 flex items-start justify-between"
                            style={{ background: i%2===0 ? `${C.border}` : 'transparent' }}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5" style={{ background: inCart ? btnAccent : C.muted }}/>
                                <span className="text-sm font-semibold" style={{ color: inCart ? btnAccent : C.txt }}>{subName}</span>
                              </div>
                              {(sub.description?.[lang] || sub.description?.ar) && (
                                <p className="text-xs mt-1 ms-3.5 leading-relaxed" style={{ color:C.muted }}>
                                  {sub.description?.[lang] || sub.description?.ar}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => inCart ? removeFromCart(sub.id) : addToCart(cat.id, sub.id, subName, catName)}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black flex-shrink-0 transition-all active:scale-95"
                              style={inCart
                                ? { background:btnAccent, color:'#fff' }
                                : { background:'transparent', border:`1px solid ${btnAccent}70`, color:btnAccent }}>
                              {inCart ? tr.cartAdded : tr.cartAdd}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

// ── PROFILE VIEW ───────────────────────────────────────────────────────
function ProfileView({ lang, tr, isRtl, profile, user, onBook, goServices, goOrders, onProfileUpdated, carBrands, carCategories, brandCategories }) {
  const [cars, setCars]               = useState([]);
  const [history, setHistory]         = useState({});
  const [expandedCar, setExpandedCar] = useState(null);
  const [loadingCars, setLoadingCars] = useState(true);

  // Edit profile state
  const [editing, setEditing]         = useState(false);
  const [editForm, setEditForm]       = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg]   = useState('');

  // Add car state
  const [showAddCar, setShowAddCar]         = useState(false);
  const [carForm, setCarForm]               = useState({ car_type:'', car_brand_id:null, car_category:'', production_year:'', plate_number:'', chassis_number:'' });
  const [registrationFile, setRegistrationFile] = useState(null);
  const [addingCar, setAddingCar]           = useState(false);

  // Edit car state
  const [editingCarId, setEditingCarId]       = useState(null);
  const [editCarForm, setEditCarForm]         = useState({});
  const [registrationEditFile, setRegistrationEditFile] = useState(null);
  const [savingCar, setSavingCar]             = useState(false);

  // Delete car state
  const [deletingCarId, setDeletingCarId] = useState(null);
  const [carDeleteError, setCarDeleteError] = useState('');

  const loadCars = () => {
    supabase.from('cars').select('*').eq('profile_id', user.id).order('created_at', { ascending:false })
      .then(({ data }) => { setCars(data||[]); setLoadingCars(false); });
  };

  useEffect(() => { if (user) loadCars(); }, [user]);

  const loadCarHistory = async (carId) => {
    if (history[carId]) return;
    const { data } = await supabase
      .from('appointments')
      .select('*, orders(id, status, total_parts_price, total_labor_price), job_cards(id, job_number, job_status)')
      .eq('car_id', carId)
      .order('appointment_date', { ascending: false });
    setHistory(p => ({ ...p, [carId]: data || [] }));
  };

  const toggleCar = (carId) => {
    if (expandedCar === carId) { setExpandedCar(null); return; }
    setExpandedCar(carId);
    loadCarHistory(carId);
  };

  const startEdit = () => {
    setEditForm({
      full_name: profile?.full_name || '',
      phone_number: profile?.phone_number || '',
      zone_number: profile?.zone_number || '',
      street_number: profile?.street_number || '',
      building_number: profile?.building_number || '',
    });
    setEditing(true);
    setProfileMsg('');
  };

  const saveProfile = async () => {
    if (!editForm.full_name?.trim() || editForm.phone_number?.length !== 8) return;
    setSavingProfile(true);
    await supabase.from('profiles').update({
      full_name: editForm.full_name.trim(),
      phone_number: editForm.phone_number,
      zone_number: editForm.zone_number?.trim() || null,
      street_number: editForm.street_number?.trim() || null,
      building_number: editForm.building_number?.trim() || null,
    }).eq('id', user.id);
    await onProfileUpdated?.();
    setSavingProfile(false);
    setEditing(false);
    setProfileMsg(tr.prof_save_ok);
    setTimeout(() => setProfileMsg(''), 3000);
  };

  const addCar = async () => {
    if (!carForm.car_type) return;
    setAddingCar(true);
    let registration_image_url = null;
    if (registrationFile) {
      const ext = registrationFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('car-registrations').upload(path, registrationFile, { upsert: true });
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('car-registrations').getPublicUrl(path);
        registration_image_url = publicUrl;
      }
    }
    await supabase.from('cars').insert({
      profile_id: user.id,
      car_type: carForm.car_type,
      car_category: carForm.car_category || null,
      production_year: carForm.production_year ? parseInt(carForm.production_year) : null,
      plate_number: carForm.plate_number.trim() || null,
      chassis_number: carForm.chassis_number.trim() || null,
      registration_image_url,
    });
    setCarForm({ car_type:'', car_brand_id:null, car_category:'', production_year:'', plate_number:'', chassis_number:'' });
    setRegistrationFile(null);
    setShowAddCar(false);
    setAddingCar(false);
    loadCars();
  };

  // Get categories filtered by selected brand in the add-car form
  const profileLinkedCatIds = new Set(
    brandCategories.filter(bc => bc.brand_id === carForm.car_brand_id).map(bc => bc.category_id)
  );
  const profileFilteredCats = (carForm.car_brand_id && profileLinkedCatIds.size > 0)
    ? carCategories.filter(c => profileLinkedCatIds.has(c.id))
    : carCategories;

  const deleteCar = async (carId) => {
    const msg = isRtl ? 'هل أنت متأكد من حذف هذه السيارة؟' : 'Are you sure you want to delete this car?';
    if (!window.confirm(msg)) return;
    setDeletingCarId(carId); setCarDeleteError('');
    const { error } = await supabase.from('cars').delete().eq('id', carId).eq('profile_id', user.id);
    if (error) {
      setCarDeleteError(isRtl ? 'لا يمكن الحذف — السيارة مرتبطة بمواعيد مسجلة.' : 'Cannot delete — car has linked appointments.');
    } else {
      setCars(prev => prev.filter(c => c.id !== carId));
      if (expandedCar === carId) setExpandedCar(null);
    }
    setDeletingCarId(null);
  };

  const openEditCar = (car) => {
    const brand = carBrands.find(b => b.name_ar === car.car_type || b.name_en === car.car_type);
    setEditCarForm({
      car_type: car.car_type || '',
      car_brand_id: brand?.id || null,
      car_category: car.car_category || '',
      production_year: car.production_year ? String(car.production_year) : '',
      plate_number: car.plate_number || '',
      chassis_number: car.chassis_number || '',
      registration_image_url: car.registration_image_url || null,
    });
    setRegistrationEditFile(null);
    setEditingCarId(car.id);
  };

  const saveEditCar = async (carId) => {
    if (!editCarForm.plate_number?.trim()) {
      alert(isRtl ? 'رقم اللوحة مطلوب' : 'Plate number is required');
      return;
    }
    setSavingCar(true);
    let registration_image_url = editCarForm.registration_image_url;
    if (registrationEditFile) {
      const ext = registrationEditFile.name.split('.').pop();
      const path = `${user.id}/${carId}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('car-registrations').upload(path, registrationEditFile, { upsert: true });
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('car-registrations').getPublicUrl(path);
        registration_image_url = publicUrl;
      }
    }
    await supabase.from('cars').update({
      car_type: editCarForm.car_type,
      car_category: editCarForm.car_category || null,
      production_year: editCarForm.production_year ? parseInt(editCarForm.production_year) : null,
      plate_number: editCarForm.plate_number?.trim() || null,
      chassis_number: editCarForm.chassis_number?.trim() || null,
      registration_image_url,
    }).eq('id', carId).eq('profile_id', user.id);
    setSavingCar(false);
    setEditingCarId(null);
    setRegistrationEditFile(null);
    loadCars();
  };

  const statusLabel = (status) => APPT_STATUS_LABELS[lang]?.[status] || status;
  const statusColor = { pending:'rgba(234,179,8,0.8)', confirmed:'rgba(59,130,246,0.8)', in_progress:'rgba(249,115,22,0.8)', completed:'rgba(34,197,94,0.8)', cancelled:'rgba(239,68,68,0.8)' };

  const canSaveProfile = editForm.full_name?.trim() && editForm.phone_number?.length === 8;

  const inField = (label, field, type='text', ph='', required=false) => (
    <div>
      <label className="block text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color:`${C.gold}80` }}>
        {label}{required && <span className="ms-1" style={{ color:'#f87171' }}>*</span>}
      </label>
      <input type={type} value={editForm[field]||''} placeholder={ph}
        onChange={e => {
          let v = e.target.value;
          if (field === 'phone_number') v = v.replace(/\D/g,'').slice(0,8);
          setEditForm(f => ({ ...f, [field]: v }));
        }}
        className={`w-full px-3 py-2.5 rounded-xl text-sm ${C.selectCls} ${C.phCls} outline-none transition-all`}
        style={{ background:C.input, border:`1px solid ${C.border}` }}
        onFocus={e=>e.target.style.borderColor=C.borderFocus}
        onBlur={e=>e.target.style.borderColor=C.border}/>
    </div>
  );

  const carField = (label, field, type='text', ph='') => (
    <div>
      <label className="block text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color:`${C.gold}80` }}>{label}</label>
      <input type={type} value={carForm[field]} placeholder={ph}
        onChange={e => {
          let v = e.target.value;
          if (field==='production_year') v = v.replace(/\D/g,'').slice(0,4);
          if (field==='chassis_number') v = v.toUpperCase().slice(0,17);
          setCarForm(f => ({ ...f, [field]: v }));
        }}
        maxLength={field==='chassis_number' ? 17 : undefined}
        className={`w-full px-3 py-2.5 rounded-xl text-sm ${C.selectCls} ${C.phCls} outline-none transition-all`}
        style={{ background:C.input, border:`1px solid ${C.border}` }}
        onFocus={e=>e.target.style.borderColor=C.borderFocus}
        onBlur={e=>e.target.style.borderColor=C.border}/>
      {field==='chassis_number' && (
        <p className="text-[10px] mt-0.5 text-end" style={{ color: carForm.chassis_number?.length===17 ? '#22c55e' : `${C.gold}60` }}>
          {carForm.chassis_number?.length||0}/17
        </p>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-2xl md:mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black flex-shrink-0" style={{ background:C.gold, color:C.btnTxt }}>
          {(profile?.full_name||user.email||'?')[0].toUpperCase()}
        </div>
        <div>
          <h1 className={`text-xl font-black ${C.selectCls}`}>{profile?.full_name || tr.myProfile}</h1>
          <p className="text-xs mt-0.5" style={{ color:C.muted }}>{user.email}</p>
        </div>
      </div>

      {/* Personal Info */}
      {(() => { const pc = CARD_BG_CYCLE[1]; return (
      <div className="rounded-2xl overflow-hidden" style={{ background:pc.bg, border:`1px solid ${editing?`${pc.fg}60`:`${pc.fg}30`}` }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-bold text-sm tracking-widest uppercase" style={{ color:pc.fg }}>{tr.myInfo}</h2>
          {!editing && (
            <button onClick={startEdit}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
              style={{ background:'rgba(0,0,0,0.15)', color:pc.fg }}>
              ✏️ {tr.prof_edit}
            </button>
          )}
        </div>

        {editing ? (
          <div className="px-5 pb-5 space-y-3">
            {inField(tr.prof_name, 'full_name', 'text', tr.fullNamePh, true)}
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color:`${C.gold}80` }}>
                {tr.prof_phone}<span className="ms-1" style={{ color:'#f87171' }}>*</span>
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 rounded-xl text-sm font-mono whitespace-nowrap flex-shrink-0"
                  style={{ background:C.input, border:`1px solid ${C.border}`, color:C.muted }}>+974</div>
                <input type="tel" value={editForm.phone_number||''} placeholder="8 أرقام"
                  onChange={e=>setEditForm(f=>({...f,phone_number:e.target.value.replace(/\D/g,'').slice(0,8)}))}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-sm ${C.selectCls} ${C.phCls} outline-none transition-all`}
                  style={{ background:C.input, border:`1px solid ${C.border}` }}
                  onFocus={e=>e.target.style.borderColor=C.borderFocus}
                  onBlur={e=>e.target.style.borderColor=C.border}/>
              </div>
              {editForm.phone_number?.length > 0 && editForm.phone_number.length !== 8 && (
                <p className="text-xs mt-1" style={{ color:'#f87171' }}>{tr.phoneError}</p>
              )}
            </div>
            <div className="pt-1">
              <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color:`${C.gold}55` }}>{tr.prof_addr}</p>
              <div className="grid grid-cols-3 gap-2">
                {inField(tr.prof_zone,     'zone_number',     'text', 'Zone 25')}
                {inField(tr.prof_street,   'street_number',   'text', 'Street 4')}
                {inField(tr.prof_building, 'building_number', 'text', 'Bldg 12')}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={()=>setEditing(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ border:`1px solid ${C.border}`, color:C.muted }}>
                {tr.prof_cancel}
              </button>
              <button onClick={saveProfile} disabled={savingProfile||!canSaveProfile}
                className="flex-1 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                style={{ background:C.gold, color:C.btnTxt }}>
                {savingProfile ? <Loader2 size={14} className="animate-spin"/> : null}
                {tr.prof_save}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 pb-5 space-y-0 divide-y" style={{ borderColor:pc.div }}>
            {[
              [tr.fullName,  profile?.full_name],
              [tr.phone,     profile?.phone_number ? `+974 ${profile.phone_number}` : null],
              [tr.email,     profile?.email || user.email],
              profile?.zone_number ? [isRtl?'العنوان':'Address',
                `${tr.profileZone} ${profile.zone_number}${profile.street_number?` · ${tr.profileStreet} ${profile.street_number}`:''}${profile.building_number?` · ${tr.profileBuilding} ${profile.building_number}`:''}`
              ] : null,
            ].filter(Boolean).filter(r=>r[1]).map(([label, value], i) => (
              <div key={i} className="flex items-center gap-3 py-2.5">
                <span className="text-xs font-semibold w-20 flex-shrink-0" style={{ color:pc.sub }}>{label}</span>
                <span className="text-sm font-semibold" style={{ color:pc.txt }}>{value}</span>
              </div>
            ))}
            {profileMsg && <p className="text-xs pt-1 font-semibold" style={{ color:pc.fg }}>{profileMsg}</p>}
          </div>
        )}
      </div>
      ); })()}

      {/* Add Car CTA */}
      <button onClick={()=>setShowAddCar(p=>!p)}
        className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        style={{ background:showAddCar?`${C.gold}25`:C.gold, color:showAddCar?C.gold:C.bg, boxShadow:showAddCar?'none':`0 0 28px ${C.gold}50`, border:showAddCar?`2px solid ${C.gold}`:'none' }}>
        <Car size={18}/>{showAddCar ? (isRtl?'إلغاء الإضافة':'Cancel') : tr.prof_add_car}
      </button>

      {/* Add Car Form */}
      {showAddCar && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background:CARD_BG_CYCLE[1].bg, border:`1px solid ${CARD_BG_CYCLE[1].fg}50` }}>
          <h3 className={`font-black text-base ${C.selectCls} flex items-center gap-2`}>
            <Car size={16} style={{ color:C.gold }}/>{tr.prof_add_car}
          </h3>
          <div className="space-y-3">
            {/* Brand dropdown */}
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color:`${C.gold}80` }}>
                {tr.prof_car_type} <span style={{ color:'#f87171' }}>*</span>
              </label>
              <select value={carForm.car_type}
                onChange={e => {
                  const brand = carBrands.find(b => (b.name_ar||b.name_en) === e.target.value);
                  setCarForm(f => ({ ...f, car_type: e.target.value, car_brand_id: brand?.id || null, car_category: '' }));
                }}
                className={`w-full px-3 py-2.5 rounded-xl text-sm ${C.selectCls} outline-none transition-all appearance-none cursor-pointer`}
                style={{ background:C.input, border:`1px solid ${C.border}` }}
                onFocus={e=>e.target.style.borderColor=C.borderFocus}
                onBlur={e=>e.target.style.borderColor=C.border}>
                <option value="">{lang==='ar'?'اختر النوع':'Select Brand'}</option>
                {sortByEn(carBrands.length > 0 ? carBrands : CAR_BRANDS.map(b => ({ id:b.key, name_ar:b.ar, name_en:b.en })))
                  .map(b => { const v=b.name_ar||b.name_en; return <option key={b.id} value={v}>{brandLabel(b, lang)}</option>; })}
              </select>
            </div>
            {/* Category dropdown - filtered by brand */}
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color:`${C.gold}80` }}>{tr.prof_car_cat}</label>
              <select value={carForm.car_category}
                onChange={e => setCarForm(f => ({ ...f, car_category: e.target.value }))}
                disabled={!carForm.car_type}
                className={`w-full px-3 py-2.5 rounded-xl text-sm ${C.selectCls} outline-none transition-all appearance-none cursor-pointer`}
                style={{ background:C.input, border:`1px solid ${C.border}`, opacity:carForm.car_type?1:0.4 }}
                onFocus={e=>e.target.style.borderColor=C.borderFocus}
                onBlur={e=>e.target.style.borderColor=C.border}>
                <option value="">{lang==='ar'?'اختر الفئة':'Select Category'}</option>
                {sortByEn(profileFilteredCats).map(c => { const v=c.name_ar||c.name_en; return <option key={c.id} value={v}>{catLabel(c, lang)}</option>; })}
              </select>
            </div>
            {/* Year dropdown */}
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color:`${C.gold}80` }}>{tr.prof_car_year}</label>
              <select value={carForm.production_year}
                onChange={e => setCarForm(f => ({ ...f, production_year: e.target.value }))}
                className={`w-full px-3 py-2.5 rounded-xl text-sm ${C.selectCls} outline-none transition-all appearance-none cursor-pointer`}
                style={{ background:C.input, border:`1px solid ${C.border}` }}
                onFocus={e=>e.target.style.borderColor=C.borderFocus}
                onBlur={e=>e.target.style.borderColor=C.border}>
                <option value="">{lang==='ar'?'اختر السنة':'Select Year'}</option>
                {BOOKING_YEAR_OPTIONS.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
            {/* Plate number - free text (optional) */}
            {carField(tr.prof_plate, 'plate_number', 'text', tr.prof_plate_ph)}
            {/* Chassis number */}
            {carField(tr.prof_chassis, 'chassis_number', 'text', tr.prof_chassis_ph)}
            {/* Registration image upload */}
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color:`${C.gold}80` }}>
                {tr.prof_registration}
              </label>
              <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all"
                style={{ background:C.input, border:`1px solid ${registrationFile ? C.gold : C.border}` }}>
                <Upload size={14} style={{ color: registrationFile ? C.gold : C.muted, flexShrink:0 }}/>
                <span className="truncate" style={{ color: registrationFile ? C.gold : C.muted }}>
                  {registrationFile ? registrationFile.name : tr.prof_reg_upload}
                </span>
                <input type="file" accept="image/*,application/pdf" className="hidden"
                  onChange={e => setRegistrationFile(e.target.files[0] || null)}/>
              </label>
            </div>
          </div>
          <button onClick={addCar} disabled={addingCar||!carForm.car_type}
            className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{ background:C.gold, color:C.btnTxt }}>
            {addingCar?<Loader2 size={14} className="animate-spin"/>:<Car size={14}/>}
            {tr.prof_add_car_btn}
          </button>
        </div>
      )}

      {/* Cars list */}
      <div>
        <h2 className="font-bold text-sm tracking-widest uppercase mb-3" style={{ color:C.gold }}>{tr.myCars}</h2>
        {loadingCars ? (
          <div className="flex items-center justify-center py-8 gap-2" style={{ color:C.muted }}>
            <Loader2 size={18} className="animate-spin"/>{isRtl?'جاري التحميل...':'Loading...'}
          </div>
        ) : cars.length === 0 ? (
          <div className="rounded-2xl p-6 text-center space-y-3" style={{ background:CARD_BG_CYCLE[1].bg, border:`1px solid ${CARD_BG_CYCLE[1].fg}30` }}>
            <Car size={40} style={{ color:CARD_BG_CYCLE[1].fg, opacity:0.5, margin:'0 auto' }}/>
            <p className="text-sm" style={{ color:CARD_BG_CYCLE[1].sub }}>{tr.noCars}</p>
            <button onClick={()=>setShowAddCar(true)} className="px-5 py-2 rounded-xl font-bold text-sm" style={{ background:C.gold, color:C.btnTxt }}>{tr.prof_add_car}</button>
          </div>
        ) : (
          <div className="space-y-3">
            {cars.map((car, carIdx) => {
              const cc     = CARD_BG_CYCLE[1]; // always maroon
              const iconCC = CARD_BG_CYCLE[0]; // gold icon for contrast
              const isOpen = expandedCar === car.id;
              const carHistory = history[car.id];
              return (
                <div key={car.id} className="rounded-2xl overflow-hidden transition-all" style={{ background:cc.bg, border:`1px solid ${isOpen?`${cc.fg}50`:`${cc.fg}25`}` }}>
                  <div className="flex items-center gap-2 p-4">
                    <button onClick={()=>toggleCar(car.id)} className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:iconCC.bg }}>
                        <Car size={22} style={{ color:iconCC.fg }}/>
                      </div>
                      <div className="flex-1 text-start min-w-0">
                        <p className="font-black" style={{ color:cc.txt }}>{car.car_type}{car.car_category ? ` · ${car.car_category}` : ''}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {car.production_year  && <span className="text-xs" style={{ color:cc.sub }}>{car.production_year}</span>}
                          {car.plate_number     && <span className="text-xs font-mono" style={{ color:cc.fg }}>{car.plate_number}</span>}
                          {car.chassis_number   && <span className="text-xs font-mono" style={{ color:cc.sub }}>{isRtl?'شاصيه:':'VIN:'} {car.chassis_number}</span>}
                        </div>
                      </div>
                      <div style={{ color:cc.fg, transform:isOpen?'rotate(90deg)':'', transition:'transform 0.2s' }}>
                        {isRtl?<ChevronLeft size={18}/>:<ChevronRight size={18}/>}
                      </div>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); if (!isOpen) setExpandedCar(car.id); openEditCar(car); }}
                      className="p-2 rounded-xl flex-shrink-0 transition-all"
                      style={{ background:'rgba(0,0,0,0.10)', color:cc.fg }}
                      title={tr.prof_edit_car}>
                      <Pencil size={14}/>
                    </button>
                  </div>

                  {isOpen && (
                    <div style={{ borderTop:`1px solid ${cc.div}` }}>
                      {/* ── Edit mode ── */}
                      {editingCarId === car.id ? (() => {
                        const editBrand = carBrands.find(b => b.name_ar === editCarForm.car_type || b.name_en === editCarForm.car_type);
                        const editBrandCatIds = new Set(brandCategories.filter(bc => bc.brand_id === (editBrand?.id || editCarForm.car_brand_id)).map(bc => bc.category_id));
                        const editFilteredCats = (editCarForm.car_brand_id && editBrandCatIds.size > 0)
                          ? carCategories.filter(c => editBrandCatIds.has(c.id))
                          : carCategories;
                        const inputStyle = { background:C.input, border:`1px solid ${C.border}`, color:'white' };
                        const focusStyle = { borderColor: C.borderFocus };
                        return (
                          <div className="p-4 space-y-3">
                            <p className="text-xs font-bold tracking-widest uppercase" style={{ color:`${C.gold}80` }}>{tr.prof_edit_car}</p>
                            {/* Brand */}
                            <select value={editCarForm.car_type}
                              onChange={e => {
                                const b = carBrands.find(br => (br.name_ar||br.name_en) === e.target.value);
                                setEditCarForm(f => ({ ...f, car_type: e.target.value, car_brand_id: b?.id || null, car_category: '' }));
                              }}
                              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                              style={inputStyle} onFocus={e=>Object.assign(e.target.style,focusStyle)} onBlur={e=>e.target.style.borderColor=C.border}>
                              <option value="">{isRtl?'اختر النوع':'Select Brand'}</option>
                              {sortByEn(carBrands).map(b => { const v=b.name_ar||b.name_en; return <option key={b.id} value={v}>{brandLabel(b, lang)}</option>; })}
                            </select>
                            {/* Category */}
                            <select value={editCarForm.car_category}
                              onChange={e => setEditCarForm(f => ({ ...f, car_category: e.target.value }))}
                              disabled={!editCarForm.car_type}
                              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                              style={{ ...inputStyle, opacity: editCarForm.car_type ? 1 : 0.4 }} onFocus={e=>Object.assign(e.target.style,focusStyle)} onBlur={e=>e.target.style.borderColor=C.border}>
                              <option value="">{isRtl?'اختر الفئة':'Select Category'}</option>
                              {sortByEn(editFilteredCats).map(c => { const v=c.name_ar||c.name_en; return <option key={c.id} value={v}>{catLabel(c, lang)}</option>; })}
                            </select>
                            {/* Year */}
                            <select value={editCarForm.production_year}
                              onChange={e => setEditCarForm(f => ({ ...f, production_year: e.target.value }))}
                              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                              style={inputStyle} onFocus={e=>Object.assign(e.target.style,focusStyle)} onBlur={e=>e.target.style.borderColor=C.border}>
                              <option value="">{isRtl?'اختر السنة':'Select Year'}</option>
                              {BOOKING_YEAR_OPTIONS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                            </select>
                            {/* Plate (required) */}
                            <div>
                              <p className="text-[10px] mb-1 font-semibold" style={{ color:C.muted }}>
                                {tr.prof_plate} <span style={{ color:'#ef4444' }}>*</span>
                              </p>
                              <input value={editCarForm.plate_number}
                                onChange={e=>setEditCarForm(f=>({...f,plate_number:e.target.value.replace(/[^A-Za-z0-9]/g,'').toUpperCase()}))}
                                placeholder={tr.prof_plate_ph} dir="ltr"
                                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
                                style={{ ...inputStyle, borderColor: !editCarForm.plate_number?.trim() ? 'rgba(239,68,68,0.4)' : C.border }}
                                onFocus={e=>Object.assign(e.target.style,focusStyle)} onBlur={e=>e.target.style.borderColor=editCarForm.plate_number?.trim()?C.border:'rgba(239,68,68,0.4)'}/>
                            </div>
                            {/* Chassis */}
                            <div>
                              <input value={editCarForm.chassis_number}
                                onChange={e=>setEditCarForm(f=>({...f,chassis_number:e.target.value.replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(0,17)}))}
                                placeholder={tr.prof_chassis_ph} maxLength={17} dir="ltr"
                                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
                                style={inputStyle} onFocus={e=>Object.assign(e.target.style,focusStyle)} onBlur={e=>e.target.style.borderColor=C.border}/>
                              <p className="text-[10px] mt-0.5 text-end" style={{ color: editCarForm.chassis_number?.length===17 ? '#22c55e' : C.dim }}>
                                {editCarForm.chassis_number?.length||0}/17
                              </p>
                            </div>
                            {/* Registration image */}
                            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-sm"
                              style={{ background:C.input, border:`1px solid ${registrationEditFile ? C.gold : C.border}` }}>
                              <Upload size={14} style={{ color: registrationEditFile ? C.gold : C.muted, flexShrink:0 }}/>
                              <span className="truncate flex-1" style={{ color: registrationEditFile ? C.gold : C.muted }}>
                                {registrationEditFile ? registrationEditFile.name : (editCarForm.registration_image_url ? (isRtl?'استمارة محفوظة — اضغط للتغيير':'Saved — tap to replace') : tr.prof_reg_upload)}
                              </span>
                              {editCarForm.registration_image_url && !registrationEditFile && (
                                <a href={editCarForm.registration_image_url} target="_blank" rel="noreferrer"
                                  onClick={e=>e.stopPropagation()}
                                  className="text-[10px] underline flex-shrink-0" style={{ color:C.gold }}>
                                  {tr.prof_reg_view}
                                </a>
                              )}
                              <input type="file" accept="image/*,application/pdf" className="hidden"
                                onChange={e => setRegistrationEditFile(e.target.files[0] || null)}/>
                            </label>
                            {/* Actions */}
                            <div className="flex gap-2 pt-1">
                              <button onClick={()=>saveEditCar(car.id)} disabled={savingCar || !editCarForm.car_type}
                                className="flex-1 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                                style={{ background:C.gold, color:C.btnTxt }}>
                                {savingCar ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>}
                                {tr.prof_save_car}
                              </button>
                              <button onClick={()=>{ setEditingCarId(null); setRegistrationEditFile(null); }}
                                className="px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                                style={{ background:`rgba(255,255,255,0.06)`, color:C.muted }}>
                                {tr.prof_cancel_edit}
                              </button>
                            </div>
                          </div>
                        );
                      })() : (
                      <>
                      <div className="px-4 py-2.5 flex items-center justify-between">
                        <p className="text-xs font-bold tracking-widest uppercase" style={{ color:`${C.gold}80` }}>{tr.myHistory}</p>
                        <button onClick={()=>onBook(car)} className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all" style={{ background:`${C.gold}20`, color:C.gold }}>
                          + {tr.bookNow}
                        </button>
                      </div>
                      {!carHistory ? (
                        <div className="flex justify-center py-4" style={{ color:C.muted }}><Loader2 size={16} className="animate-spin"/></div>
                      ) : carHistory.length === 0 ? (
                        <p className="px-4 pb-2 text-sm text-center" style={{ color:C.muted }}>{tr.noHistory}</p>
                      ) : (
                        <div className="divide-y" style={{ borderColor:C.border }}>
                          {carHistory.map(appt => {
                            const svcs = parseServices(appt.service_type);
                            const svcLabel = svcs ? svcs.map(s => s.name || '').join(' · ') : (appt.service_type || '—');
                            const order = appt.orders?.[0];
                            const jobCard = appt.job_cards?.[0];
                            const ORD_LABEL = {
                              draft:     isRtl ? 'مسودة عرض السعر'  : 'Draft Quote',
                              pending:   isRtl ? 'بانتظار الموافقة' : 'Awaiting Approval',
                              sourcing:  isRtl ? 'جاري توريد القطع' : 'Sourcing Parts',
                              ready:     isRtl ? 'جاهز للاستلام'    : 'Ready for Pickup',
                              delivered: isRtl ? 'تم التسليم'        : 'Delivered',
                              completed: isRtl ? 'مكتمل'             : 'Completed',
                              cancelled: isRtl ? 'ملغي'              : 'Cancelled',
                            };
                            const ORD_COLOR = { draft:'#94a3b8', pending:'#60a5fa', sourcing:'#eab308', ready:'#22c55e', delivered:'#a855f7', completed:'#22c55e', cancelled:'#ef4444' };
                            const jcColor = jobCard ? (JC_STATUS_COLOR[jobCard.job_status] || '#94a3b8') : null;
                            const jcLabel = jobCard ? (tr[`jc_${jobCard.job_status}`] || jobCard.job_status) : null;
                            return (
                            <div key={appt.id} className="px-4 py-3 flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background:`${C.gold}20` }}>
                                  <Wrench size={14} style={{ color:C.gold }}/>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-semibold ${C.selectCls} leading-snug`}>{svcLabel}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs" style={{ color:C.muted }}>{appt.appointment_date}</span>
                                  </div>
                                  {/* Job card status is the only status shown to customer */}
                                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                                    {jobCard ? (
                                      <>
                                        <span className="text-[10px] font-mono" style={{ color:C.muted }}>{tr.jc_number}: {jobCard.job_number}</span>
                                        <span className="text-[11px] font-black px-2.5 py-1 rounded-full text-white"
                                          style={{ background: jcColor }}>
                                          {jcLabel}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white"
                                        style={{ background: '#94a3b8' }}>
                                        {tr.jc_waiting}
                                      </span>
                                    )}
                                  </div>
                                  {order && (
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                        style={{ color: ORD_COLOR[order.status]||C.muted, background: (ORD_COLOR[order.status]||'#fff') + '18' }}>
                                        {ORD_LABEL[order.status] || order.status}
                                      </span>
                                      {Number(order.total_labor_price) > 0 && (
                                        <span className="text-[10px]" style={{ color:C.muted }}>
                                          {(Number(order.total_parts_price||0)+Number(order.total_labor_price||0)).toLocaleString()} {isRtl?'ر.ق':'QAR'}
                                        </span>
                                      )}
                                      {['delivered','completed'].includes(order.status) && (
                                        <button onClick={goOrders}
                                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                          style={{ color:C.gold, background:`${C.gold}15`, border:`1px solid ${C.gold}30` }}>
                                          {isRtl ? '📄 عرض الفاتورة' : '📄 View Invoice'}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      )}
                      {/* Delete car button */}
                      <div className="px-4 pb-4 pt-2">
                        {carDeleteError && deletingCarId === null && expandedCar === car.id && (
                          <p className="text-xs text-center mb-2" style={{ color:'rgba(248,113,113,0.9)' }}>{carDeleteError}</p>
                        )}
                        <button
                          onClick={()=>deleteCar(car.id)}
                          disabled={deletingCarId === car.id}
                          className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
                          style={{ border:'1px solid rgba(248,113,113,0.25)', color:'rgba(248,113,113,0.8)' }}>
                          {deletingCarId === car.id
                            ? <Loader2 size={12} className="animate-spin"/>
                            : <X size={12}/>}
                          {isRtl ? 'حذف هذه السيارة' : 'Remove This Car'}
                        </button>
                      </div>
                      </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SERVICE CARD ──────────────────────────────────────────────────────
function ServiceCard({ service, lang, span, onClick }) {
  const Icon = service.icon;
  return (
    <button onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden text-start h-36 md:h-48 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] ${span===2?'col-span-2':'col-span-1'}`}
      style={{ backgroundColor:service.bg, boxShadow:'0 4px 20px rgba(0,0,0,0.35)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background:'linear-gradient(160deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.25) 100%)' }}/>
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow:`inset 0 0 0 1px ${C.gold}25` }}/>
      <div className="absolute top-0 start-0 p-3 md:p-4">
        <p className="font-black text-[15px] md:text-[18px] leading-snug text-white"
          style={{ textShadow: service.bg==='#FFCB74' ? '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' : 'none' }}>
          {service[lang]}
        </p>
      </div>
      <div className="absolute bottom-0 end-0 -mb-3 -me-3 pointer-events-none">
        {service.ar === 'صيانة دورية' ? (
          <svg width={span===2?110:85} height={span===2?110:85} viewBox="0 0 80 92" xmlns="http://www.w3.org/2000/svg" className="md:!w-[125px] md:!h-[125px]" style={{ color:'rgba(0,0,0,0.32)' }}>
            <defs>
              <mask id="sandak-gear-mask">
                <rect fill="white" width="80" height="92"/>
                <circle cx="40" cy="22" r="8" fill="black"/>
              </mask>
            </defs>
            {/* Gear — 8 wide teeth + ring, center hole */}
            <g fill="currentColor" mask="url(#sandak-gear-mask)">
              <circle cx="40" cy="22" r="15"/>
              {[0,45,90,135,180,225,270,315].map(d=>(
                <rect key={d} x="36.5" y="2" width="7" height="14" rx="2" transform={`rotate(${d} 40 22)`}/>
              ))}
            </g>
            {/* Car cabin trapezoid */}
            <path d="M23 55 L30 44 L50 44 L57 55Z" fill="currentColor"/>
            {/* Car body */}
            <rect x="10" y="54" width="60" height="19" rx="4" fill="currentColor"/>
            {/* Windshield highlight */}
            <path d="M26 54 L32 46 L48 46 L54 54Z" fill="rgba(255,255,255,0.25)"/>
            {/* Left headlight */}
            <rect x="12" y="57" width="13" height="11" rx="3" fill="rgba(255,255,255,0.3)"/>
            {/* Right headlight */}
            <rect x="55" y="57" width="13" height="11" rx="3" fill="rgba(255,255,255,0.3)"/>
            {/* Grille */}
            <rect x="33" y="60" width="14" height="7" rx="2" fill="rgba(255,255,255,0.2)"/>
            {/* Wheels */}
            <circle cx="21" cy="79" r="10" fill="currentColor"/>
            <circle cx="59" cy="79" r="10" fill="currentColor"/>
            {/* Wheel rims */}
            <circle cx="21" cy="79" r="5" fill="rgba(255,255,255,0.35)"/>
            <circle cx="59" cy="79" r="5" fill="rgba(255,255,255,0.35)"/>
          </svg>
        ) : (
          <Icon size={span===2?95:75} strokeWidth={1.1} className="md:!w-[110px] md:!h-[110px]" style={{ color:service.ic }}/>
        )}
      </div>
      {service.key==='periodic' && (
        <div className="absolute bottom-3 start-3">
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase" style={{ background:C.gold, color:C.btnTxt }}>VIP</span>
        </div>
      )}
    </button>
  );
}

// ── STEP 2 · DETAILS ──────────────────────────────────────────────────
function DetailsStep({ lang, tr, formData, setFormData, setStep, prevStep, user, carBrands, carCategories, brandCategories }) {
  const [userCars, setUserCars]       = useState([]);
  const [carsLoading, setCarsLoading] = useState(false);
  const [addingNew, setAddingNew]     = useState(false);

  useEffect(() => {
    if (!user) return;
    setCarsLoading(true);
    supabase.from('cars').select('*').eq('profile_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setUserCars(data || []); setCarsLoading(false); });
  }, [user?.id]);

  useEffect(() => {
    if (!carsLoading && user && userCars.length === 0) setAddingNew(true);
  }, [carsLoading]);

  const selectExistingCar = car => {
    const brand = carBrands.find(b => b.name_ar === car.car_type || b.name_en === car.car_type);
    setFormData(p => ({
      ...p, carId: car.id,
      carBrandKey: car.car_type || '', carBrandId: brand?.id || null,
      carCategoryKey: car.car_category || '',
      carModel: car.production_year?.toString() || '',
    }));
  };

  const clearSelection = () => setFormData(p => ({ ...p, carId: null, carBrandKey: '', carBrandId: null, carCategoryKey: '', carModel: '' }));

  // Filter categories by selected brand (fallback: show all if no linkages defined)
  const linkedCatIds = new Set(
    brandCategories.filter(bc => bc.brand_id === formData.carBrandId).map(bc => bc.category_id)
  );
  const filteredCats = (formData.carBrandId && linkedCatIds.size > 0)
    ? carCategories.filter(c => linkedCatIds.has(c.id))
    : carCategories;

  // Shared car fields (used in both logged-in add-new and guest mode)
  const carFields = (
    <>
      <Field label={tr.carBrand}>
        <select value={formData.carBrandKey}
          onChange={e => {
            const brand = carBrands.find(b => (b.name_ar||b.name_en) === e.target.value);
            setFormData(p => ({ ...p, carBrandKey: e.target.value, carBrandId: brand?.id || null, carCategoryKey: '' }));
          }}
          className={`${C.inputCls} appearance-none cursor-pointer`} style={{ background: C.input, border: `1px solid ${C.border}` }}>
          <option value="">{tr.selectBrand}</option>
          {sortByEn(carBrands.length > 0 ? carBrands : CAR_BRANDS.map(b => ({ id: b.key, name_ar: b.ar, name_en: b.en })))
            .map(b => { const v=b.name_ar||b.name_en; return <option key={b.id} value={v}>{brandLabel(b, lang)}</option>; })}
        </select>
      </Field>
      <Field label={tr.carCategory}>
        <select value={formData.carCategoryKey}
          onChange={e => setFormData(p => ({ ...p, carCategoryKey: e.target.value }))}
          disabled={!formData.carBrandKey}
          className={`${C.inputCls} appearance-none cursor-pointer`}
          style={{ background: C.input, border: `1px solid ${C.border}`, opacity: formData.carBrandKey ? 1 : 0.4 }}>
          <option value="">{tr.selectCategory}</option>
          {sortByEn(filteredCats).map(c => { const v=c.name_ar||c.name_en; return <option key={c.id} value={v}>{catLabel(c, lang)}</option>; })}
        </select>
      </Field>
      <Field label={tr.carYear}>
        <select value={formData.carModel} onChange={e => setFormData(p => ({ ...p, carModel: e.target.value }))}
          className={`${C.inputCls} appearance-none cursor-pointer`} style={{ background: C.input, border: `1px solid ${C.border}` }}>
          <option value="">{tr.selectYear}</option>
          {BOOKING_YEAR_OPTIONS.map(y => <option key={y} value={String(y)}>{y}</option>)}
        </select>
      </Field>
    </>
  );

  // ── Logged-in path ────────────────────────────────────────────────
  if (user) {
    const canGo = formData.carId !== null || (addingNew && !!formData.carBrandKey && formData.carModel.length === 4);
    return (
      <FormShell title={tr.yourCar}>
        {/* Selected car chip */}
        {formData.carId && !addingNew && (
          <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: C.card, border: `1px solid ${C.gold}40` }}>
            <div>
              <p className="font-black" style={{ color: C.cardText }}>{formData.carBrandKey}{formData.carCategoryKey ? ` · ${formData.carCategoryKey}` : ''}</p>
              {formData.carModel && <p className="text-xs mt-0.5" style={{ color: C.cardMuted }}>{formData.carModel}</p>}
            </div>
            <button onClick={clearSelection} className="text-xs px-3 py-1.5 rounded-xl font-bold" style={{ color: C.cardText, border: `1px solid ${C.cardText}40` }}>
              {tr.changeCar}
            </button>
          </div>
        )}

        {/* Car list */}
        {!formData.carId && !addingNew && (
          <div className="space-y-3">
            {carsLoading
              ? <div className="flex items-center justify-center py-8 gap-2" style={{ color: C.muted }}><Loader2 size={16} className="animate-spin"/>{tr.loadingCars}</div>
              : userCars.map(car => (
                  <button key={car.id} onClick={() => selectExistingCar(car)}
                    className="w-full text-inherit p-4 rounded-2xl text-start transition-all active:scale-[0.98] flex items-center gap-3"
                    style={{ background: C.card, border: `1px solid ${C.border}` }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.gold + '60'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${C.cardText}18` }}>
                      <Car size={16} style={{ color: C.cardText }}/>
                    </div>
                    <div>
                      <p className="font-black text-sm" style={{ color: C.cardText }}>{car.car_type}{car.car_category ? ` · ${car.car_category}` : ''}</p>
                      {(car.production_year || car.plate_number) && (
                        <p className="text-xs mt-0.5" style={{ color: C.cardMuted }}>
                          {[car.production_year, car.plate_number].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <ChevronLeft size={16} style={{ color: C.cardMuted, marginRight: 'auto' }}/>
                  </button>
                ))
            }
            <button onClick={() => setAddingNew(true)}
              className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{ border: `1px dashed ${C.gold}50`, color: C.gold }}>
              <Plus size={14}/>{tr.addCarNew}
            </button>
          </div>
        )}

        {/* Add new car form */}
        {addingNew && !formData.carId && (
          <div className="space-y-4">
            {userCars.length > 0 && (
              <button onClick={() => setAddingNew(false)} className="text-sm flex items-center gap-1.5 mb-1" style={{ color: C.muted }}>
                <ChevronRight size={14}/>{tr.backToCars}
              </button>
            )}
            {carFields}
          </div>
        )}
        <NavBtns tr={tr} onBack={prevStep} onNext={() => setStep(3)} canNext={canGo}/>
      </FormShell>
    );
  }

  // ── Guest path ────────────────────────────────────────────────────
  const canGoGuest = formData.name.trim() && formData.phone.length === 8 && formData.carBrandKey && formData.carModel.length === 4;
  return (
    <FormShell title={tr.yourDetails}>
      <Field label={tr.fullName}>
        <input type="text" placeholder={tr.fullNamePh} value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
          className={C.inputCls} style={{ background: C.input, border: `1px solid ${C.border}` }}
          onFocus={e => e.target.style.borderColor = C.borderFocus} onBlur={e => e.target.style.borderColor = C.border}/>
      </Field>
      <Field label={tr.phone}>
        <div className="flex gap-2">
          <div className="flex items-center px-3 rounded-xl text-sm font-mono whitespace-nowrap" style={{ background: C.input, border: `1px solid ${C.border}`, color: C.muted }}>+974</div>
          <input type="tel" placeholder={tr.phoneHint} value={formData.phone}
            onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 8) setFormData(p => ({ ...p, phone: v })); }}
            className={`${C.inputCls} flex-1`} style={{ background: C.input, border: `1px solid ${C.border}` }}
            onFocus={e => e.target.style.borderColor = C.borderFocus} onBlur={e => e.target.style.borderColor = C.border}/>
        </div>
        {formData.phone.length > 0 && formData.phone.length !== 8 && <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>{tr.phoneError}</p>}
      </Field>
      {carFields}
      <NavBtns tr={tr} onBack={prevStep} onNext={() => setStep(3)} canNext={canGoGuest}/>
    </FormShell>
  );
}

// ── STEP 3 · SCHEDULE ─────────────────────────────────────────────────
function ScheduleStep({ lang, tr, formData, setFormData, setStep, prevStep }) {
  const isRtl = lang === 'ar';
  const today = new Date().toISOString().split('T')[0];
  const canGo = formData.date && formData.timeKey;
  const dateInputRef = useRef(null);
  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    if (el.showPicker) el.showPicker(); else el.focus();
  };
  return (
    <FormShell title={tr.pickTime}>
      <Field label={tr.date}>
        <div className="relative">
          <input ref={dateInputRef} type="date" min={today} value={formData.date} onChange={e=>setFormData(p=>({...p,date:e.target.value}))}
            className="absolute inset-0 w-full h-full opacity-0" tabIndex={-1}/>
          <div onClick={openDatePicker}
            className={`${C.inputCls} cursor-pointer flex items-center`}
            style={{ background:C.input, border:`1px solid ${C.border}`, color: formData.date ? C.text : C.muted }}>
            {formData.date
              ? new Date(formData.date + 'T00:00:00').toLocaleDateString(isRtl ? 'ar-QA' : 'en-QA', { year:'numeric', month:'long', day:'numeric' })
              : (isRtl ? 'اختاري التاريخ' : 'Select a date')}
          </div>
        </div>
      </Field>
      <Field label={tr.selectTime}>
        <div className="grid grid-cols-2 gap-3">
          {TIME_SLOTS.map(slot=>(
            <button key={slot.key} onClick={()=>setFormData(p=>({...p,timeKey:slot.key}))}
              className="py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95"
              style={formData.timeKey===slot.key ? { background:C.gold, color:C.btnTxt, boxShadow:`0 0 20px ${C.gold}50` } : { background:C.input, border:`1px solid ${C.border}`, color:C.muted }}>
              {slot[lang]}
            </button>
          ))}
        </div>
      </Field>
      <Field label={tr.notes}>
        <textarea rows={3} placeholder={tr.notesPh} value={formData.notes} onChange={e=>setFormData(p=>({...p,notes:e.target.value}))}
          className={`${C.inputCls} resize-none`} style={{ background:C.input, border:`1px solid ${C.border}` }}
          onFocus={e=>e.target.style.borderColor=C.borderFocus} onBlur={e=>e.target.style.borderColor=C.border}/>
      </Field>
      <NavBtns tr={tr} onBack={prevStep} onNext={()=>setStep(4)} canNext={canGo}/>
    </FormShell>
  );
}

// ── STEP 4 · REVIEW ───────────────────────────────────────────────────
function ReviewStep({ lang, tr, formData, setStep, prevStep, loading, setLoading, user, profile, cart }) {
  const slot = getSlot(formData.timeKey);

  const submit = async () => {
    setLoading(true);
    try {
      // Store cart as JSON array in service_type
      const serviceType = cart.length > 0
        ? JSON.stringify(cart.map(s => ({ id: s.id, name: s.name, catName: s.catName })))
        : (formData.serviceName || '');
      if (user) {
        let carId = formData.carId;
        if (!carId) {
          const { data: carData, error: carErr } = await supabase.from('cars')
            .insert([{
              profile_id: user.id,
              car_type: formData.carBrandKey,
              car_category: formData.carCategoryKey || null,
              production_year: parseInt(formData.carModel) || null,
            }]).select('id').single();
          if (carErr) throw carErr;
          carId = carData.id;
        }
        const { error: apptErr } = await supabase.from('appointments').insert([{
          profile_id: user.id, car_id: carId,
          appointment_date: formData.date, appointment_time: formData.timeKey,
          service_type: serviceType,
          customer_notes: formData.notes, status: 'pending',
        }]);
        if (apptErr) throw apptErr;
      } else {
        const { error } = await supabase.from('bookings').insert([{
          customer_name: formData.name, customer_phone: formData.phone,
          car_type: formData.carBrandKey, car_model: formData.carModel,
          car_category: formData.carCategoryKey || null,
          service_type: serviceType,
          appointment_date: formData.date, appointment_time: formData.timeKey,
          notes: formData.notes,
        }]);
        if (error) throw error;
      }
      setStep(5);
    } catch(err) { alert(tr.errorMsg + ': ' + err.message); }
    finally { setLoading(false); }
  };

  const carDisplay = [formData.carBrandKey, formData.carCategoryKey, formData.carModel].filter(Boolean).join('  ·  ');
  const cartItems  = cart.length > 0 ? cart : [];

  const metaRows = [
    ...(user
      ? [{ label: tr.customer, value: `${profile?.full_name || formData.name}  ·  +974 ${profile?.phone_number || formData.phone}` }]
      : [{ label: tr.customer, value: `${formData.name}  ·  +974 ${formData.phone}` }]
    ),
    { label: tr.car,       value: carDisplay || '—' },
    { label: tr.apptLabel, value: `${formData.date}  ·  ${slot?.[lang]}` },
    ...(formData.notes ? [{ label: tr.notes, value: formData.notes }] : []),
  ];

  return (
    <FormShell title={tr.reviewTitle}>
      {/* Selected services */}
      {cartItems.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background:C.card, border:`1px solid ${C.border}` }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom:`1px solid ${C.cardText}22` }}>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color:C.cardMuted }}>{tr.service}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:`${C.cardText}22`, color:C.cardText }}>{cartItems.length}</span>
          </div>
          {cartItems.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderBottom: i < cartItems.length-1 ? `1px solid ${C.cardText}14` : 'none' }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:C.cardText }}/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color:C.cardText }}>{s.name}</p>
                <p className="text-[10px]" style={{ color:C.cardMuted }}>{s.catName}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Meta rows */}
      <div className="rounded-2xl overflow-hidden" style={{ background:C.card, border:`1px solid ${C.border}` }}>
        {metaRows.map((row,i)=>(
          <div key={i} className="flex items-start justify-between gap-4 px-5 py-4"
            style={{ borderBottom:i<metaRows.length-1?`1px solid ${C.cardText}14`:'none' }}>
            <span className="text-sm flex-shrink-0" style={{ color:C.cardMuted }}>{row.label}</span>
            <span className="text-sm font-semibold text-end" style={{ color:C.cardText }}>{row.value}</span>
          </div>
        ))}
      </div>
      <button onClick={submit} disabled={loading}
        className="w-full py-4 rounded-xl font-black text-[15px] tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background:C.gold, color:C.btnTxt, boxShadow:`0 0 28px ${C.gold}50` }}>
        {loading?<><Loader2 size={17} className="animate-spin"/>{tr.confirming}</>:tr.confirm}
      </button>
      <button onClick={prevStep} className="w-full py-3.5 rounded-xl font-medium text-sm transition-all" style={{ border:`1px solid ${C.border}`, color:C.muted }}>{tr.edit}</button>
    </FormShell>
  );
}

// ── STEP 5 · SUCCESS ──────────────────────────────────────────────────
function SuccessStep({ tr, name, resetAll, goOrders }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] text-center p-8 space-y-6">
      <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background:`${C.gold}15`, border:`1px solid ${C.gold}35`, boxShadow:`0 0 50px ${C.gold}20` }}>
        <CheckCircle2 size={48} color={C.gold}/>
      </div>
      <div className="space-y-2">
        <h2 className={`text-3xl font-black ${C.selectCls}`}>{tr.successTitle}</h2>
        {name&&<p className="font-bold text-lg" style={{ color:C.gold }}>{name}</p>}
        <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color:C.muted }}>{tr.successMsg}</p>
      </div>
      <button onClick={goOrders} className="w-full max-w-xs py-4 rounded-xl font-black transition-all active:scale-[0.98]" style={{ background:C.gold, color:C.btnTxt, boxShadow:`0 0 28px ${C.gold}50` }}>
        {tr.navOrders}
      </button>
      <button onClick={resetAll} className="text-sm font-semibold" style={{ color:C.muted }}>
        {tr.backHome}
      </button>
    </div>
  );
}

// ── SHARED COMPONENTS ──────────────────────────────────────────────────
function FormShell({ title, children }) {
  return (
    <div className="p-4 md:p-8 space-y-4 max-w-lg md:mx-auto">
      <div className="mb-2">
        <h1 className={`text-2xl font-black ${C.selectCls}`}>{title}</h1>
        <div className="w-10 h-0.5 rounded-full mt-2" style={{ background:`${C.gold}70` }}/>
      </div>
      {children}
    </div>
  );
}
function Field({ label, children }) {
  return <div><label className={labelCls} style={{ color:`${C.gold}80` }}>{label}</label>{children}</div>;
}
function NavBtns({ tr, onBack, onNext, canNext }) {
  return (
    <div className="flex gap-3 pt-2">
      <button onClick={onBack} className="w-1/3 py-3.5 rounded-xl font-medium text-sm transition-all" style={{ border:`1px solid ${C.border}`, color:C.muted }}>{tr.back}</button>
      <button onClick={onNext} disabled={!canNext} className="flex-1 py-3.5 rounded-xl font-black text-sm transition-all active:scale-[0.98]"
        style={{ background:canNext?C.gold:`${C.gold}30`, color:canNext?C.bg:`${C.gold}60`, boxShadow:canNext?`0 0 18px ${C.gold}45`:'none', cursor:canNext?'pointer':'not-allowed' }}>
        {tr.next}
      </button>
    </div>
  );
}
function MobNavItem({ icon:Icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 px-3 py-1">
      <div className="relative">
        <Icon size={20} color={active?C.gold:C.dim}/>
        {badge > 0 && (
          <span className="absolute -top-1.5 -end-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full text-[8px] font-black flex items-center justify-center"
            style={{ background:'#ef4444', color:'#fff' }}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="text-[9px] font-semibold" style={{ color:active?C.gold:C.dim }}>{label}</span>
    </button>
  );
}

// ── AUTH MODAL ─────────────────────────────────────────────────────────
function AuthModal({ mode, setMode, tr, isRtl, reason, onSuccess }) {
  const [email, setEmail]         = useState(() => localStorage.getItem('sndk_saved_email') || '');
  const [password, setPassword]   = useState(() => localStorage.getItem('sndk_saved_pw') || '');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('sndk_saved_email'));
  const [fullName, setFullName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [done, setDone]           = useState(false);
  const [isForgot, setIsForgot]   = useState(false);
  const [forgotBy, setForgotBy]   = useState('email'); // 'email' | 'phone'
  const [forgotPhone, setForgotPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [foundEmail, setFoundEmail] = useState('');
  const isSignUp = mode === 'signup';

  const inp = { background:C.input, border:`1px solid ${C.border}`, color:C.text };

  const goBack = () => { setIsForgot(false); setDone(false); setError(''); setPhoneVerified(false); setFoundEmail(''); setForgotPhone(''); setEmail(''); };

  // ── forgot password submit ──
  const handleForgot = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      let target = email;
      if (forgotBy === 'phone') {
        if (!phoneVerified) {
          // step 1: look up phone in profiles
          const { data, error:lookupErr } = await supabase
            .from('profiles').select('id').eq('phone_number', forgotPhone).maybeSingle();
          if (lookupErr) throw lookupErr;
          if (!data) throw new Error(tr.forgotPhoneNotFound);
          // get email from auth via magic — we ask user to confirm their email next
          setPhoneVerified(true); setLoading(false); return;
        }
        target = email; // email entered after phone verified
      }
      const { error:resetErr } = await supabase.auth.resetPasswordForEmail(target, {
        redirectTo: window.location.origin + window.location.pathname,
      });
      if (resetErr) throw resetErr;
      setDone(true);
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── sign in / sign up submit ──
  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isSignUp) {
        const { data, error:signUpErr } = await supabase.auth.signUp({ email, password });
        if (signUpErr) throw signUpErr;
        if (data.user) {
          await supabase.from('profiles').insert([{ id:data.user.id, full_name:fullName, phone_number:phone, user_role:'customer', language_preference:isRtl?'ar':'en' }]);
        }
        setDone(true);
      } else {
        const { error:signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;
        if (rememberMe) {
          localStorage.setItem('sndk_saved_email', email);
          localStorage.setItem('sndk_saved_pw', password);
        } else {
          localStorage.removeItem('sndk_saved_email');
          localStorage.removeItem('sndk_saved_pw');
        }
        onSuccess();
      }
    } catch(err) { setError(err.message||tr.authError); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={isRtl?'rtl':'ltr'} style={{ background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl" style={{ background:C.panel, border:`1px solid ${C.border}` }}>

        {/* Header */}
        <div className="mx-auto -mb-2">
          <img src="/logo-animated.gif" alt="SNDK" className="mx-auto w-full" style={{ height:'auto' }}/>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-black ${C.selectCls}`}>
              {isForgot ? tr.forgotTitle : isSignUp ? tr.signUp : tr.signIn}
            </h2>
            {!isForgot && reason==='book' && <p className="text-xs mt-1" style={{ color:'rgba(114,47,55,0.75)' }}>{tr.bookRequiresLoginSub}</p>}
            <div className="w-8 h-0.5 rounded-full mt-1.5" style={{ background:'#722F37' }}/>
          </div>
          <button onClick={()=>setMode(null)} style={{ color:C.muted }}><X size={20}/></button>
        </div>

        {/* ── Forgot Password Screen ── */}
        {isForgot ? (
          done ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 size={48} color="#722F37" className="mx-auto"/>
              <p className={`font-bold ${C.selectCls}`}>{tr.forgotSent}</p>
              <p className="text-sm" style={{ color:C.muted }}>{tr.forgotSentSub}</p>
              <button onClick={goBack} className="w-full py-3 rounded-xl font-black text-sm mt-2" style={{ background:'#722F37', color:'#ffffff' }}>{tr.forgotBack}</button>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              {/* Email / Phone tabs */}
              <div className="grid grid-cols-2 rounded-xl overflow-hidden" style={{ border:'1px solid rgba(114,47,55,0.30)' }}>
                {[['email', tr.forgotByEmail], ['phone', tr.forgotByPhone]].map(([k, label]) => (
                  <button key={k} type="button" onClick={() => { setForgotBy(k); setError(''); setPhoneVerified(false); setFoundEmail(''); setEmail(''); }}
                    className="py-2.5 text-sm font-bold transition-all"
                    style={forgotBy===k ? { background:'#722F37', color:'#ffffff' } : { background:'#FFCB74', color:'#111111' }}>
                    {label}
                  </button>
                ))}
              </div>

              {forgotBy === 'email' ? (
                <div>
                  <label className={labelCls} style={{ color:'rgba(114,47,55,0.75)' }}>{tr.email}</label>
                  <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder={tr.emailPh}
                    className={C.inputCls} style={inp}
                    onFocus={e=>e.target.style.borderColor='#722F37'} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
              ) : (
                <>
                  {!phoneVerified ? (
                    <div>
                      <label className={labelCls} style={{ color:'rgba(114,47,55,0.75)' }}>{tr.phone}</label>
                      <div className="flex gap-2">
                        <div className="flex items-center px-3 rounded-xl text-sm font-mono whitespace-nowrap" style={{ background:C.input, border:`1px solid ${C.border}`, color:C.muted }}>+974</div>
                        <input type="tel" required value={forgotPhone}
                          onChange={e=>{const v=e.target.value.replace(/\D/g,'');if(v.length<=8)setForgotPhone(v);}}
                          placeholder="XXXXXXXX" className={`${C.inputCls} flex-1`} style={inp}
                          onFocus={e=>e.target.style.borderColor='#722F37'} onBlur={e=>e.target.style.borderColor=C.border}/>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold mb-2 rounded-xl px-3 py-2" style={{ color:'#722F37', background:'rgba(114,47,55,0.08)' }}>✓ {tr.forgotPhoneCheck}</p>
                      <label className={labelCls} style={{ color:'rgba(114,47,55,0.75)' }}>{tr.email}</label>
                      <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder={tr.emailPh}
                        className={C.inputCls} style={inp}
                        onFocus={e=>e.target.style.borderColor='#722F37'} onBlur={e=>e.target.style.borderColor=C.border}/>
                    </div>
                  )}
                </>
              )}

              {error && <p className="text-sm text-center py-1 rounded-lg" style={{ color:'#f87171', background:'rgba(248,113,113,0.1)' }}>{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background:'#722F37', color:'#ffffff', opacity:loading?0.7:1 }}>
                {loading ? <Loader2 size={16} className="animate-spin"/> : null}
                {forgotBy==='phone' && !phoneVerified ? (isRtl?'تحقق من الرقم':'Verify Number') : tr.forgotSend}
              </button>

              <div className="text-center">
                <button type="button" onClick={goBack} className="text-sm font-bold underline" style={{ color:C.muted }}>{tr.forgotBack}</button>
              </div>
            </form>
          )

        ) : done ? (
          /* ── Sign Up Done ── */
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 size={48} color="#722F37" className="mx-auto"/>
            <p className={`${C.selectCls} font-semibold`}>{tr.confirmEmailMsg}</p>
            <button onClick={()=>setMode(null)} className="w-full py-3 rounded-xl font-black text-sm mt-2" style={{ background:'#722F37', color:'#ffffff' }}>OK</button>
          </div>

        ) : (
          /* ── Sign In / Sign Up Form ── */
          <form onSubmit={handleSubmit} className="space-y-3">
            {isSignUp && (
              <>
                <div>
                  <label className={labelCls} style={{ color:'rgba(114,47,55,0.75)' }}>{tr.fullName}</label>
                  <input type="text" required value={fullName} onChange={e=>setFullName(e.target.value)} placeholder={tr.fullNamePh} className={C.inputCls} style={inp}
                    onFocus={e=>e.target.style.borderColor='#722F37'} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
                <div>
                  <label className={labelCls} style={{ color:'rgba(114,47,55,0.75)' }}>{tr.phone}</label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 rounded-xl text-sm font-mono whitespace-nowrap" style={{ background:C.input, border:`1px solid ${C.border}`, color:C.muted }}>+974</div>
                    <input type="tel" required value={phone} onChange={e=>{const v=e.target.value.replace(/\D/g,'');if(v.length<=8)setPhone(v);}} placeholder={tr.phoneHint}
                      className={`${C.inputCls} flex-1`} style={inp}
                      onFocus={e=>e.target.style.borderColor='#722F37'} onBlur={e=>e.target.style.borderColor=C.border}/>
                  </div>
                </div>
              </>
            )}
            <div>
              <label className={labelCls} style={{ color:'rgba(114,47,55,0.75)' }}>{tr.email}</label>
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder={tr.emailPh} className={C.inputCls} style={inp}
                onFocus={e=>e.target.style.borderColor='#722F37'} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls} style={{ color:'rgba(114,47,55,0.75)' }}>{tr.password}</label>
                {!isSignUp && (
                  <button type="button" onClick={() => { setIsForgot(true); setError(''); }}
                    className="text-[11px] font-bold" style={{ color:'#722F37' }}>
                    {tr.forgotPw}
                  </button>
                )}
              </div>
              <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder={tr.passwordPh} className={C.inputCls} style={inp}
                onFocus={e=>e.target.style.borderColor='#722F37'} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
            {!isSignUp && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div onClick={() => setRememberMe(v => !v)}
                  className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: rememberMe ? '#722F37' : 'transparent', border: `2px solid ${rememberMe ? '#722F37' : C.border}` }}>
                  {rememberMe && <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className="text-sm" style={{ color: C.muted }}>{isRtl ? 'تذكرني' : 'Remember me'}</span>
              </label>
            )}
            {error&&<p className="text-sm text-center py-1 rounded-lg" style={{ color:'#f87171', background:'rgba(248,113,113,0.1)' }}>{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2"
              style={{ background:'#722F37', color:'#ffffff', opacity:loading?0.7:1 }}>
              {loading?<Loader2 size={16} className="animate-spin"/>:null}
              {isSignUp?tr.signUp:tr.signIn}
            </button>
            <div className="text-center pt-1">
              <span className="text-sm" style={{ color:C.muted }}>{isSignUp?tr.hasAccount:tr.noAccount}{' '}</span>
              <button type="button" onClick={()=>{setMode(isSignUp?'signin':'signup');setError('');}} className="text-sm font-bold underline" style={{ color:'#722F37' }}>
                {isSignUp?tr.signIn:tr.signUp}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── NEW PASSWORD MODAL (opened via reset link) ─────────────────────────
function NewPasswordModal({ tr, isRtl, onClose }) {
  const [pw, setPw]   = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr]  = useState('');
  const inp = { background:C.input, border:`1px solid ${C.border}`, color:C.text };

  const handleSave = async e => {
    e.preventDefault();
    if (pw !== pw2) { setErr(tr.pwNoMatch); return; }
    setErr(''); setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" dir={isRtl?'rtl':'ltr'} style={{ background:'rgba(0,0,0,0.80)', backdropFilter:'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-5 shadow-2xl" style={{ background:C.panel, border:`1px solid ${C.border}` }}>
        <div>
          <h2 className={`text-xl font-black ${C.selectCls}`}>{tr.newPwTitle}</h2>
          <div className="w-8 h-0.5 rounded-full mt-1.5" style={{ background:'#722F37' }}/>
        </div>
        {done ? (
          <div className="py-4 text-center space-y-3">
            <CheckCircle2 size={48} color="#722F37" className="mx-auto"/>
            <p className={`font-bold ${C.selectCls}`}>{tr.newPwDone}</p>
            <button onClick={onClose} className="w-full py-3 rounded-xl font-black text-sm" style={{ background:'#722F37', color:'#ffffff' }}>OK</button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className={labelCls} style={{ color:'rgba(114,47,55,0.75)' }}>{tr.newPwLabel}</label>
              <input type="password" required minLength={6} value={pw} onChange={e=>setPw(e.target.value)}
                placeholder="••••••••" className={C.inputCls} style={inp}
                onFocus={e=>e.target.style.borderColor='#722F37'} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
            <div>
              <label className={labelCls} style={{ color:'rgba(114,47,55,0.75)' }}>{tr.newPwConfirm}</label>
              <input type="password" required minLength={6} value={pw2} onChange={e=>setPw2(e.target.value)}
                placeholder="••••••••" className={C.inputCls} style={inp}
                onFocus={e=>e.target.style.borderColor='#722F37'} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
            {err && <p className="text-sm text-center py-1 rounded-lg" style={{ color:'#f87171', background:'rgba(248,113,113,0.1)' }}>{err}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background:'#722F37', color:'#ffffff', opacity:loading?0.7:1 }}>
              {loading ? <Loader2 size={16} className="animate-spin"/> : null}
              {tr.newPwSave}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
