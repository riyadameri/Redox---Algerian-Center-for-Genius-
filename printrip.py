#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import datetime
from PIL import Image, ImageDraw, ImageFont
import tempfile

def create_receipt_image():
    """إنشاء صورة الإيصال"""
    # إنشاء صورة جديدة (384 بكسل عرض للطابعات الحرارية)
    width = 384
    height = 800
    img = Image.new('1', (width, height), 1)  # نمط 1-bit (أبيض وأسود)
    draw = ImageDraw.Draw(img)
    
    # استخدام خط افتراضي (يمكن تغييره لخط عربي إذا توفر)
    try:
        font = ImageFont.truetype('arial.ttf', 24)
    except:
        font = ImageFont.load_default()
    
    # محتوى الإيصال
    receipt_lines = [
        "مدرسة التعلم الحديثة",
        "إيصال دفع",
        "-------------------------",
        f"التاريخ: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "رقم الفاتورة: INV-123",
        "-------------------------",
        "الطالب: أحمد محمد",
        "المبلغ: 5000 د.ج",
        "طريقة الدفع: نقدي",
        "-------------------------",
        "شكراً لثقتكم بنا"
    ]
    
    # كتابة النص على الصورة
    y_pos = 10
    for line in receipt_lines:
        # احتساب عرض النص
        text_width = draw.textlength(line, font=font)
        x_pos = (width - text_width) // 2  # توسيط النص
        
        draw.text((x_pos, y_pos), line, font=font, fill=0)
        y_pos += 30
    
    return img

def print_image_directly(img):
    """طباعة الصورة مباشرة على الطابعة"""
    try:
        # حفظ الصورة مؤقتاً بصيغة PPM (أكثر دعمًا)
        with tempfile.NamedTemporaryFile(suffix='.ppm', delete=False) as tmp:
            img_path = tmp.name
            img.save(img_path, 'PPM')
        
        # قراءة ملف PPM وإرساله مباشرة إلى الطابعة
        with open(img_path, 'rb') as f:
            ppm_data = f.read()
        
        # إرسال البيانات الخام مباشرة إلى الطابعة
        with open('/dev/usb/lp1', 'wb') as printer:
            printer.write(ppm_data)
        
        print("تمت الطباعة بنجاح!")
        return True
    except Exception as e:
        print(f"حدث خطأ: {str(e)}")
        return False
    finally:
        if os.path.exists(img_path):
            os.unlink(img_path)

if __name__ == "__main__":
    # إنشاء صورة الإيصال
    receipt_img = create_receipt_image()
    
    # طباعة الصورة مباشرة
    print_image_directly(receipt_img)