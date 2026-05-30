import discord
from discord.ext import commands, tasks
import config
from src.todo_db import TodoDB
from src.data_helper import DataHelper
from src.gemini_secretary import GeminiSecretary
import sys
import asyncio
import datetime
import re
import json

# บังคับใช้ UTF-8 สำหรับแสดงผลใน Terminal ของ Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

# กำหนดสิทธิ์การทำงานของบอท Discord (Intents)
intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents, help_command=None)

# เริ่มต้นตัวช่วยจัดการข้อมูลและฐานข้อมูล
db = TodoDB()
data_helper = DataHelper()
secretary = GeminiSecretary(config.GEMINI_API_KEY)

# ปุ่มกดสำหรับจัดการตารางงาน Todo ผ่าน UI
class TodoView(discord.ui.View):
    def __init__(self, todo_id, task_name):
        super().__init__(timeout=120.0)
        self.todo_id = todo_id
        self.task_name = task_name

    @discord.ui.button(label="เสร็จสิ้นภารกิจ (Done)", style=discord.ButtonStyle.green, emoji="✅")
    async def complete_todo_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        success = db.complete_todo(self.todo_id)
        if success:
            for child in self.children:
                child.disabled = True
            await interaction.message.edit(view=self)
            await interaction.response.send_message(f"🎉 ยอดเยี่ยมครับคุณท่าน! ภารกิจ **\"{self.task_name}\"** ได้รับการบันทึกว่าสำเร็จเรียบร้อยแล้วครับกระผม!", ephemeral=False)
        else:
            await interaction.response.send_message("❌ เกิดข้อผิดพลาดในการบันทึกสถานะครับคุณท่าน", ephemeral=True)
        self.stop()

    @discord.ui.button(label="ลบภารกิจ (Delete)", style=discord.ButtonStyle.danger, emoji="🗑️")
    async def delete_todo_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        success = db.delete_todo(self.todo_id)
        if success:
            for child in self.children:
                child.disabled = True
            await interaction.message.edit(view=self)
            await interaction.response.send_message(f"🗑️ รับทราบครับกระผม ลบภารกิจ **\"{self.task_name}\"** ออกจากรายการเรียบร้อยครับ", ephemeral=False)
        else:
            await interaction.response.send_message("❌ ไม่สามารถลบภารกิจได้ครับคุณท่าน", ephemeral=True)
        self.stop()

# ปุ่มกดสำหรับยืนยันการบันทึกข้อมูลหน้าปกหนังสือลงเว็บไซต์
class ConfirmBookView(discord.ui.View):
    def __init__(self, data, data_helper, placeholder_message):
        super().__init__(timeout=60.0)
        self.data = data
        self.dh = data_helper
        self.placeholder_message = placeholder_message

    @discord.ui.button(label="ยืนยันบันทึกหนังสือ", style=discord.ButtonStyle.green, emoji="✅")
    async def confirm(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.defer()
        
        # บันทึกหนังสือจริงด้วยสถานะ "bought" (ซื้อมาดอง/ซื้อแล้ว) เพราะคุณท่านถ่ายรูปเล่มจริงมาส่ง
        success = self.dh.add_book(
            title=self.data.get("title"),
            author=self.data.get("author", "ไม่ระบุ"),
            description=self.data.get("desc", ""),
            category=self.data.get("category", "ทั่วไป"),
            status="bought"
        )
        
        if success:
            for child in self.children:
                child.disabled = True
            await interaction.message.edit(view=self)
            await interaction.followup.send(
                f"🎉 **บันทึกหนังสือลงเว็บสำเร็จครับคุณท่าน!** หนังสือ **\"{self.data.get('title')}\"** "
                f"ได้รับการบันทึกข้อมูลเข้าสู่เว็บไซต์ RaDeTCh (สถานะ: 📦 ซื้อแล้ว) เรียบร้อยแล้วครับกระผม!", 
                ephemeral=False
            )
        else:
            await interaction.followup.send("❌ บันทึกข้อมูลล้มเหลว กรุณาตรวจสอบไฟล์คอนฟิกหลังบ้านครับคุณท่าน", ephemeral=True)
        self.stop()

    @discord.ui.button(label="ยกเลิก", style=discord.ButtonStyle.red, emoji="❌")
    async def cancel(self, interaction: discord.Interaction, button: discord.ui.Button):
        for child in self.children:
            child.disabled = True
        await interaction.message.edit(view=self)
        await interaction.response.send_message("❌ ยกเลิกรายการแล้ว ข้อมูลนี้จะไม่ถูกจดบันทึกครับคุณท่าน", ephemeral=False)
        self.stop()

@bot.event
async def on_ready():
    print(f"=== บอทราฟาเอล (Raphael) พร้อมรับใช้นายท่านแล้ว! ===", flush=True)
    print(f"ล็อกอินในชื่อ: {bot.user.name} ({bot.user.id})", flush=True)
    print(f"ฐานข้อมูล To-Do: {db.db_path}", flush=True)
    print(f"เชื่อมต่อคลังอาหาร/ท่องเที่ยว/เพลงร่วมกับหน้าเว็บ: {data_helper.data_dir}", flush=True)
    print("=" * 45, flush=True)
    
    # เริ่มต้นระบบเช็กเตือนความจำพื้นหลัง
    if not check_reminders.is_running():
        check_reminders.start()

# Loop สำหรับคอยสแกนแจ้งเตือน
@tasks.loop(seconds=15)
async def check_reminders():
    try:
        pending = db.get_pending_reminders()
        for rem in pending:
            channel_id = rem.get("channel_id")
            message_text = rem.get("message")
            rem_id = rem.get("id")
            
            # ส่งแจ้งเตือน
            if channel_id:
                channel = bot.get_channel(channel_id)
                if channel:
                    embed = discord.Embed(
                        title="🔔 [เสียงกระดิ่ง] แจ้งเตือนความจำครับคุณท่าน!",
                        description=f"เรียนคุณท่านครับ... ถึงเวลาของบันทึกเตือนความจำ:\n\n✨ **\"{message_text}\"**",
                        color=discord.Color.gold()
                    )
                    embed.set_footer(text="กระผม 'ราฟาเอล' คอยดูแลคุณท่านเสมอครับ 🛡️")
                    await channel.send(embed=embed)
            
            # ทำเครื่องหมายว่าส่งแล้ว
            db.mark_reminder_sent(rem_id)
    except Exception as e:
        print(f"[Reminder Loop Error] {e}", flush=True)

# คำสั่งช่วยเหลือ !help
@bot.command(name="help")
async def help_command(ctx):
    embed = discord.Embed(
        title="🛡️ ยินดีต้อนรับครับคุณท่าน! กระผม ราฟาเอล (Raphael)",
        description="เลขาส่วนตัวที่ดูแลชีวิตประจำวัน ความเป็นอยู่ และช่วยบันทึกข้อมูลต่าง ๆ ลงบนหน้าเว็บไซต์ RaDeTCh ทันทีเมื่อท่านสั่งคุย!",
        color=discord.Color.dark_teal()
    )
    
    embed.add_field(
        name="💬 1. พูดคุยทั่วไป & สั่งบันทึกข้อมูลเข้าสู่หน้าเว็บ (AI Secretary)",
        value="ท่านสามารถ **@ราฟาเอล** หรือ DM มาคุยได้เลยครับกระผม นอกจากคุยเล่นแล้ว ท่านยังสามารถพิมพ์สั่งเพื่อบันทึกข้อมูลเข้าเว็บ เช่น:\n"
              "• *'ราฟาเอล เพิ่มเมนู ข้าวมันไก่ พลังงาน 600 kcal ลงในเว็บหน่อย'*\n"
              "• *'ราฟาเอล เพิ่มเพลง Senbonzakura ของ Ado ภาษาญี่ปุ่น ลิงก์... เข้าเว็บหน่อย'*\n"
              "• *'ช่วยบันทึกหนังสือที่ควรอ่านชื่อ The Psychology of Money ผู้แต่ง Morgan Housel ลงเว็บที'*\n"
              "• *'เพิ่มที่เที่ยวชื่อ Shirakawa-go จังหวัด Toyama ในเว็บให้หน่อย'*",
        inline=False
    )
    embed.add_field(
        name="📸 2. ถ่ายรูปปกหนังสือจริงบันทึกเข้าเว็บ (Scan Book Cover)",
        value="เพียงทำการ **อัปโหลดรูปถ่ายหน้าปกหนังสือจริง** เข้ามาในห้องแชทพร้อม **@ราฟาเอล** หรือส่งมาใน DM กระผมจะวิเคราะห์ชื่อหนังสือ ผู้แต่ง หมวดหมู่ และสรุปความยาวสั้น ๆ ด้วย Gemini Vision และมีปุ่มให้กดบันทึกเข้าหน้าเว็บได้ทันทีเลยครับ!",
        inline=False
    )
    embed.add_field(
        name="📝 3. รายการภารกิจ (To-Do List)",
        value=(
            "• `!todo` หรือ `!todo list` : ดูภารกิจค้างอยู่ทั้งหมด\n"
            "• `!todo add [ภารกิจ]` : เพิ่มภารกิจใหม่ลงระบบ (ใส่ `#สูง` `#ด่วน` ได้)"
        ),
        inline=False
    )
    embed.add_field(
        name="⏰ 4. แจ้งเตือนความจำ (Reminders)",
        value=(
            "• `!remind [นาที] [ข้อความ]` : ตั้งแจ้งเตือนล่วงหน้า เช่น `!remind 10 ปิดไฟเตาแก๊ส`\n"
            "• `!remind [เวลา HH:MM] [ข้อความ]` : เตือนเวลานั้น ๆ เช่น `!remind 22:30 นอนได้แล้วครับ`"
        ),
        inline=False
    )
    embed.add_field(
        name="🍳 5. คลังโภชนาการอาหารบนเว็บ (Meal Helper)",
        value=(
            "• `!menu` : สุ่มแนะนำเมนูแสนอร่อยบนหน้าเว็บพร้อมวิธีปรุงและโภชนาการ\n"
            "• `!menu tag [ประเภท]` : ค้นหาเฉพาะกลุ่มวัตถุดิบ เช่น `!menu tag หมู`"
        ),
        inline=False
    )
    embed.add_field(
        name="📚 6. หนังสือที่ควรอ่านบนเว็บ (Recommended Books)",
        value=(
            "• `!book` หรือ `!book list` : เรียกดูหนังสือแนะนำที่บันทึกไว้ในเว็บไซต์\n"
            "• `!book add [ชื่อหนังสือ] | [ผู้แต่ง] | [หมวดลำดับขั้น]` : เพิ่มหนังสือ เช่น `!book add Minna | 3A | การเรียน/ภาษา/ภาษาญี่ปุ่น`\n"
            "• `!book cats` / `!book categories` : ดูต้นไม้ลำดับขั้นหมวดหมู่ทั้งหมดในคลัง\n"
            "• `!book cat [หมวด]` : กรองหนังสือในหมวดนั้นๆ (รวมถึงหมวดย่อย)\n"
            "• `!book search [คำค้น]` : ค้นหาหนังสือจากชื่อเรื่อง ผู้เขียน รายละเอียด หรือหมวดหมู่"
        ),
        inline=False
    )
    embed.add_field(
        name="🎵 7. เพิ่มเพลงลงหน้าเว็บ (Add Music Playlist)",
        value="• `!music add [ภาษา] | [นักร้อง] | [ชื่อเพลง] | [ลิงก์ Youtube]` : เพิ่มเพลงใหม่ลงคลังเพลงเว็บทันที",
        inline=False
    )
    embed.add_field(
        name="📅 8. ตารางรูทีน & แหล่งเที่ยว (Routine & Travel)",
        value=(
            "• `!routine` / `!routine ot` / `!routine weekend` : ดูรูทีนประจำวัน\n"
            "• `!travel` : สุ่มแนะนำสถานที่เที่ยวญี่ปุ่นแสนสวยพร้อมบันทึกลงเว็บ"
        ),
        inline=False
    )
    
    embed.set_footer(text="มีสิ่งใดให้บราฟาเอลช่วยเหลือเรียนเชิญแจ้งได้ทันทีครับคุณท่าน")
    await ctx.reply(embed=embed)

# คำสั่งย่อยของ Todo !todo
@bot.group(name="todo", invoke_without_command=True)
async def todo_group(ctx):
    await todo_list(ctx)

@todo_group.command(name="list")
async def todo_list(ctx):
    todos = db.get_todos(status="pending")
    if not todos:
        embed = discord.Embed(
            title="📝 รายการภารกิจของนายท่าน",
            description="ยอดเยี่ยมยิ่งครับ! ขณะนี้ **ไม่มีภารกิจค้างคาอยู่เลย** ครับคุณท่าน 🎉",
            color=discord.Color.green()
        )
        await ctx.reply(embed=embed)
        return

    embed = discord.Embed(
        title="📝 รายการภารกิจที่ค้างอยู่ของนายท่าน",
        description="นี่คือภารกิจที่กระผมบันทึกไว้และยังคงรอการดำเนินการจากคุณท่านครับกระผม:",
        color=discord.Color.orange()
    )
    for item in todos:
        due = f" (กำหนด: {item.get('due_date')})" if item.get('due_date') else ""
        embed.add_field(
            name=f"ID: {item.get('id')} | หมวด: {item.get('category')} [ความสำคัญ: {item.get('priority')}]",
            value=f"✨ **{item.get('task')}**{due}\n*พิมพ์ `!todo done {item.get('id')}` เมื่อสำเร็จภารกิจ*",
            inline=False
        )
    embed.set_footer(text=f"รวมทั้งหมด {len(todos)} รายการ · พิมพ์ !todo done [ID] หรือคลิกปุ่มใต้การ์ดข้อความเดิม")
    await ctx.reply(embed=embed)

@todo_group.command(name="add")
async def todo_add(ctx, *, task: str):
    category = "ทั่วไป"
    priority = "ปานกลาง"
    
    tags = re.findall(r'#(\w+)', task)
    clean_task = re.sub(r'#\w+', '', task).strip()
    
    for t in tags:
        if t in ["สูง", "ต่ำ", "ด่วน", "สำคัญ"]:
            priority = t
        else:
            category = t
            
    todo_id = db.add_todo(clean_task, category=category, priority=priority)
    embed = discord.Embed(
        title="✅ บันทึกภารกิจเรียบร้อยแล้วครับ",
        description=f"กระผมได้จดบันทึกภารกิจใหม่ลงในสมุดเตือนใจเรียบร้อยแล้วครับคุณท่าน:",
        color=discord.Color.green()
    )
    embed.add_field(name="📋 ภารกิจ", value=f"**{clean_task}**", inline=False)
    embed.add_field(name="📂 หมวดหมู่", value=category, inline=True)
    embed.add_field(name="🔥 ความสำคัญ", value=priority, inline=True)
    
    view = TodoView(todo_id, clean_task)
    await ctx.reply(embed=embed, view=view)

@todo_group.command(name="done")
async def todo_done(ctx, todo_id: int):
    success = db.complete_todo(todo_id)
    if success:
        await ctx.reply(f"🎉 รับทราบครับกระผม! บันทึกภารกิจ ID {todo_id} สำเร็จเสร็จสิ้นแล้ว ยอดเยี่ยมมากครับคุณท่าน! 🌟")
    else:
        await ctx.reply(f"❌ ขออภัยครับคุณท่าน กระผมไม่พบภารกิจ ID {todo_id} ในระบบเลยครับ")

@todo_group.command(name="del")
async def todo_delete(ctx, todo_id: int):
    success = db.delete_todo(todo_id)
    if success:
        await ctx.reply(f"🗑️ ลบรายการภารกิจ ID {todo_id} ออกจากระบบเรียบร้อยแล้วครับคุณท่าน")
    else:
        await ctx.reply(f"❌ ขออภัยครับคุณท่าน กระผมไม่พบภารกิจ ID {todo_id} เลยครับ")

# คำสั่ง !remind สำหรับแจ้งเตือน
@bot.command(name="remind")
async def remind_command(ctx, time_arg: str, *, message: str):
    now = datetime.datetime.now()
    target_time = None
    
    if time_arg.isdigit():
        minutes = int(time_arg)
        target_time = now + datetime.timedelta(minutes=minutes)
        time_str = target_time.strftime("%Y-%m-%d %H:%M:%S")
        time_display = f"อีก {minutes} นาทีข้างหน้า (เวลา {target_time.strftime('%H:%M:%S')})"
    elif ":" in time_arg:
        try:
            hour, minute = map(int, time_arg.split(":"))
            target_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            if target_time < now:
                target_time += datetime.timedelta(days=1)
            time_str = target_time.strftime("%Y-%m-%d %H:%M:%S")
            time_display = f"เวลา {target_time.strftime('%Y-%m-%d %H:%M')}"
        except Exception:
            await ctx.reply("❌ รูปแบบเวลาไม่ถูกต้องครับคุณท่าน กรุณาใช้ตัวเลขนาที (เช่น `15`) หรือเวลาจริง (เช่น `22:30`) ครับ")
            return
    else:
        await ctx.reply("❌ รูปแบบเวลาไม่ถูกต้องครับคุณท่าน กรุณาระบุเป็นนาทีหรือจุดเวลา (เช่น `10` หรือ `14:00`) ครับ")
        return
        
    db.add_reminder(message, time_str, ctx.channel.id)
    
    embed = discord.Embed(
        title="⏰ ตั้งเวลาแจ้งเตือนสำเร็จครับคุณท่าน",
        description=f"กระผมบราฟาเอลจะทำการสั่นกระดิ่งเตือนความจำให้นายท่านตามกำหนดด้านล่างนี้ครับกระผม:",
        color=discord.Color.blue()
    )
    embed.add_field(name="💬 ข้อความเตือนความจำ", value=f"**\"{message}\"**", inline=False)
    embed.add_field(name="📅 กำหนดเวลา", value=time_display, inline=False)
    embed.set_footer(text="กระผมจะส่งสัญญาณเตือนในช่องแชทนี้ตามเวลานัดหมายครับ")
    
    await ctx.reply(embed=embed)

# คำสั่ง !menu แนะนำเมนูอาหาร
@bot.command(name="menu")
async def menu_command(ctx, action: str = None, *, arg: str = None):
    menu = None
    if action == "tag" and arg:
        menu = data_helper.get_random_menu(tag=arg.strip())
    elif action:
        menu = data_helper.get_random_menu(tag=action.strip())
    else:
        menu = data_helper.get_random_menu()
        
    if not menu:
        await ctx.reply("❌ ขออภัยด้วยครับคุณท่าน กระผมไม่พบเมนูที่เข้าข่ายเงื่อนไขดังกล่าวเลยครับ")
        return
        
    embed = discord.Embed(
        title=f"{menu.get('emoji', '🍳')} แนะนำเมนูอาหาร: {menu.get('name')}",
        description=menu.get('desc', 'เมนูอาหารแนะนำแสนอร่อยสำหรับคุณท่าน'),
        color=discord.Color.purple()
    )
    embed.add_field(name="🌍 สัญชาติ", value=menu.get('nationality', 'ไม่ระบุ').upper(), inline=True)
    embed.add_field(name="🔥 พลังงาน", value=f"{menu.get('calories', '—')} kcal", inline=True)
    embed.add_field(name="⏳ เวลาทำ", value=f"{menu.get('time', '—')} นาที", inline=True)
    
    ingredients_str = ""
    for ing in menu.get('ingredients', []):
        ingredients_str += f"• {ing.get('name')}: {ing.get('amount')}\n"
    if ingredients_str:
        embed.add_field(name="🛒 วัตถุดิบหลัก", value=ingredients_str, inline=False)
        
    steps_str = ""
    for idx, step in enumerate(menu.get('steps', []), 1):
        steps_str += f"{idx}. {step}\n"
    if steps_str:
        if len(steps_str) > 600:
            steps_str = steps_str[:570] + "...\n*(มีขั้นตอนต่อในคลังข้อมูล)*"
        embed.add_field(name="👩‍🍳 ขั้นตอนการทำโดยย่อ", value=steps_str, inline=False)
        
    embed.set_footer(text="หากต้องการสุ่มรายการใหม่ สามารถพิมพ์ !menu อีกครั้งได้เลยครับกระผม")
    if menu.get("image"):
        embed.set_image(url=menu.get("image"))
        
    await ctx.reply(embed=embed)

# คำสั่ง !music สำหรับจัดการเพลงลงเว็บ
@bot.command(name="music")
async def music_command(ctx, action: str = None, *, arg: str = None):
    if action == "add" and arg:
        try:
            parts = [p.strip() for p in arg.split("|")]
            if len(parts) < 4:
                await ctx.reply("❌ รูปแบบไม่ครบถ้วนครับกระผม! กรุณาระบุ `!music add [ภาษา] | [นักร้อง] | [ชื่อเพลง] | [ลิงก์ Youtube]`")
                return
            lang, artist, title, url = parts[0], parts[1], parts[2], parts[3]
            
            success = data_helper.add_music_song(lang, artist, title, url)
            if success:
                embed = discord.Embed(
                    title="🎵 บันทึกเพลงใหม่เข้าสู่หน้าเว็บสำเร็จครับ!",
                    description=f"กระผมได้จดบันทึกเพลงใหม่ลงในคลังเพลง `music-playlist.json` ของหน้าเว็บเรียบร้อยแล้วครับกระผม:",
                    color=discord.Color.red()
                )
                embed.add_field(name="🎶 ชื่อเพลง", value=title, inline=True)
                embed.add_field(name="🎤 ศิลปิน", value=artist, inline=True)
                embed.add_field(name="🌐 หมวดภาษา", value=lang.upper(), inline=True)
                embed.add_field(name="🔗 ลิงก์เพลง", value=url, inline=False)
                await ctx.reply(embed=embed)
            else:
                await ctx.reply("❌ บันทึกเพลงไม่สำเร็จครับคุณท่าน อาจจะมีเพลงนี้อยู่ในระบบแล้ว หรือลิขสิทธิ์ตรงกันครับ")
        except Exception as e:
            await ctx.reply(f"❌ ขออภัยอย่างยิ่งครับคุณท่าน ระบบบันทึกขัดข้อง: {str(e)}")
    else:
        await ctx.reply("🎵 ยินดีต้อนรับสู่คลังเพลง RaDeTCh! พิมพ์ `!music add [ภาษา] | [นักร้อง] | [ชื่อเพลง] | [ลิงก์]` เพื่อเก็บข้อมูลลงเว็บได้ครับคุณท่าน")

# คำสั่ง !book สำหรับจัดการคลังหนังสือแนะนำ
@bot.group(name="book", invoke_without_command=True)
async def book_group(ctx):
    await book_list(ctx)

@book_group.command(name="list")
async def book_list(ctx):
    books = data_helper.get_books()
    if not books:
        embed = discord.Embed(
            title="📚 คลังหนังสือที่ควรอ่านของคุณท่าน",
            description="ขณะนี้ไม่มีรายการแนะนำในเว็บไซต์เลยครับคุณท่าน พิมพ์สั่งบราฟาเอลเพิ่มให้ได้เลยครับ!",
            color=discord.Color.dark_green()
        )
        await ctx.reply(embed=embed)
        return

    embed = discord.Embed(
        title="📚 คลังหนังสือที่ควรอ่านในระบบเว็บไซต์ RaDeTCh",
        description="นี่คือข้อมูลหนังสือที่กระผมได้ช่วยรวบรวมเก็บไว้ในระบบฐานข้อมูลพอร์ตของคุณท่านครับ:",
        color=discord.Color.dark_green()
    )
    
    # ดึงขึ้นมาแสดง 10 เล่มแรกเพื่อไม่ให้ข้อความล้น
    for b in books[:10]:
        status = b.get('status')
        status_emoji = "❤️ อยากซื้อ" if status == "wishlist" else "📦 ซื้อแล้ว (ดอง)" if status == "bought" else "📖 กำลังอ่าน" if status == "reading" else "🎉 อ่านจบแล้ว"
        embed.add_field(
            name=f"📖 {b.get('title')} — {b.get('author')}",
            value=f"• **หมวด:** {b.get('category')} | **สถานะ:** {status_emoji}\n• **รายละเอียด:** {b.get('description', '—')}",
            inline=False
        )
        
    if len(books) > 10:
        embed.set_footer(text=f"แสดงผล 10 จากทั้งหมด {len(books)} เล่ม · หน้าเว็บพอร์ตจะโชว์ข้อมูลนี้ทั้งหมดครับกระผม")
    else:
        embed.set_footer(text="ราฟาเอลยินดีค้นคว้าหนังสือดีๆ มาเตือนความจำคุณท่านเสมอครับ")
        
    await ctx.reply(embed=embed)

@book_group.command(name="add")
async def book_add(ctx, *, arg: str):
    try:
        parts = [p.strip() for p in arg.split("|")]
        if len(parts) < 2:
            await ctx.reply("❌ รูปแบบไม่ถูกต้องครับคุณท่าน! กรุณาพิมพ์ `!book add [ชื่อหนังสือ] | [ผู้แต่ง] | [หมวด (ใส่หรือไม่ใส่ก็ได้ เช่น การเรียน/ภาษา/ภาษาอังกฤษ)]` ครับ")
            return
            
        title, author = parts[0], parts[1]
        category = parts[2] if len(parts) > 2 else "ทั่วไป"
        
        success = data_helper.add_book(title, author, category=category)
        if success:
            embed = discord.Embed(
                title="📚 บันทึกหนังสือลงระบบหน้าเว็บสำเร็จครับคุณท่าน!",
                description=f"กระผมได้จดลิสต์หนังสือที่ควรอ่านเล่มใหม่ลงในฐานข้อมูล `portfolio.db` เรียบร้อยครับ:",
                color=discord.Color.green()
            )
            embed.add_field(name="📘 ชื่อหนังสือ", value=title, inline=True)
            embed.add_field(name="✍️ ผู้เขียน", value=author, inline=True)
            embed.add_field(name="📂 หมวดหมู่", value=category, inline=True)
            await ctx.reply(embed=embed)
        else:
            await ctx.reply("❌ เกิดข้อผิดพลาดในการบันทึกลง Database ของหน้าเว็บครับคุณท่าน")
    except Exception as e:
        await ctx.reply(f"❌ ขออภัยอย่างยิ่ง เกิดข้อผิดพลาดระบบขัดข้อง: {e}")

@book_group.command(name="categories", aliases=["cats"])
async def book_categories(ctx):
    books = data_helper.get_books()
    if not books:
        await ctx.reply("📚 ขณะนี้คลังหนังสือยังว่างอยู่ ไม่มีหมวดหมู่ให้แสดงผลครับคุณท่าน")
        return
        
    # สร้างโครงสร้างต้นไม้หมวดหมู่ลำดับขั้น
    tree = {}
    for b in books:
        category = b.get("category") or "ทั่วไป"
        parts = [p.strip() for p in category.split("/") if p.strip()]
        if not parts:
            parts = ["ทั่วไป"]
            
        main = parts[0]
        sub = parts[1] if len(parts) > 1 else None
        sub_sub = parts[2] if len(parts) > 2 else None
        
        if main not in tree:
            tree[main] = {"count": 0, "subs": {}}
        tree[main]["count"] += 1
        
        if sub:
            if sub not in tree[main]["subs"]:
                tree[main]["subs"][sub] = {"count": 0, "sub_subs": {}}
            tree[main]["subs"][sub]["count"] += 1
            
            if sub_sub:
                if sub_sub not in tree[main]["subs"][sub]["sub_subs"]:
                    tree[main]["subs"][sub]["sub_subs"][sub_sub] = 0
                tree[main]["subs"][sub]["sub_subs"][sub_sub] += 1
                
    # จัดหน้าตาการแสดงต้นไม้หมวดหมู่
    embed = discord.Embed(
        title="🗂️ ตัวสำรวจหมวดหมู่ลำดับขั้น (Category Explorer Tree)",
        description="นี่คือรายการหมวดหมู่หนังสือทั้งหมดที่จัดหมวดไว้ในคลังของคุณท่านครับกระผม:",
        color=discord.Color.dark_green()
    )
    
    tree_text = ""
    for main, main_data in tree.items():
        tree_text += f"📂 **{main}** ({main_data['count']} เล่ม)\n"
        for sub, sub_data in main_data["subs"].items():
            tree_text += f"　↳ **{sub}** ({sub_data['count']} เล่ม)\n"
            for sub_sub, count in sub_data["sub_subs"].items():
                tree_text += f"　　⋄ {sub_sub} ({count} เล่ม)\n"
                
    embed.add_field(name="ลำดับขั้นหมวดหมู่ทั้งหมด", value=tree_text or "— ไม่มีข้อมูลหมวดหมู่ย่อย —", inline=False)
    embed.set_footer(text="ท่านสามารถค้นหาตามหมวดได้โดยสั่ง '!book category [ชื่อหมวด]' ครับกระผม")
    await ctx.reply(embed=embed)

@book_group.command(name="category", aliases=["cat", "filter"])
async def book_category(ctx, *, category_path: str):
    category_path = category_path.strip()
    books = data_helper.get_books()
    
    # ทำการกรองแบบระดับชั้น: ค้นหาว่าขึ้นต้นด้วย category_path หรือไม่
    filtered_books = []
    for b in books:
        b_cat = b.get("category") or "ทั่วไป"
        # เช็กความเข้ากันแบบ Prefix Matching
        if b_cat == category_path or b_cat.startswith(category_path + "/"):
            filtered_books.append(b)
            
    if not filtered_books:
        await ctx.reply(f"❌ ขอประทานอภัยครับคุณท่าน กระผมไม่พบหนังสือในหมวดหมู่ **\"{category_path}\"** หรือหมวดย่อยของมันเลยครับ")
        return
        
    embed = discord.Embed(
        title=f"🗂️ รายชื่อหนังสือในหมวด: {category_path}",
        description=f"กระผมพบหนังสือทั้งหมด {len(filtered_books)} เล่ม ในหมวดหมู่นี้ครับคุณท่าน:",
        color=discord.Color.dark_green()
    )
    
    for b in filtered_books[:10]:
        status = b.get('status')
        status_emoji = "❤️ อยากซื้อ" if status == "wishlist" else "📦 ซื้อแล้ว (ดอง)" if status == "bought" else "📖 กำลังอ่าน" if status == "reading" else "🎉 อ่านจบแล้ว"
        embed.add_field(
            name=f"📖 {b.get('title')} — {b.get('author')}",
            value=f"• **หมวดย่อยคัดสรร:** {b.get('category')} | **สถานะ:** {status_emoji}\n• **รายละเอียด:** {b.get('description', '—')}",
            inline=False
        )
        
    if len(filtered_books) > 10:
        embed.set_footer(text=f"แสดงผล 10 จากทั้งหมด {len(filtered_books)} เล่ม")
    else:
        embed.set_footer(text="ราฟาเอลยินดีหยิบยื่นหนังสือหมวดนี้เพื่อจรรโลงสมองให้นายท่านครับ")
        
    await ctx.reply(embed=embed)

@book_group.command(name="search", aliases=["find"])
async def book_search(ctx, *, query: str):
    query = query.strip().lower()
    books = data_helper.get_books()
    
    filtered_books = []
    for b in books:
        title = (b.get("title") or "").lower()
        author = (b.get("author") or "").lower()
        category = (b.get("category") or "").lower()
        desc = (b.get("description") or "").lower()
        
        if query in title or query in author or query in category or query in desc:
            filtered_books.append(b)
            
    if not filtered_books:
        await ctx.reply(f"❌ ขอประทานอภัยครับคุณท่าน กระผมค้นหาคำว่า **\"{query}\"** ไม่พบในชื่อเรื่อง ผู้แต่ง หมวดหมู่ หรือรายละเอียดของหนังสือเลยครับ")
        return
        
    embed = discord.Embed(
        title=f"🔍 ผลการค้นหาหนังสือสำหรับ: \"{query}\"",
        description=f"กระผมค้นพบหนังสือที่ตรงกับคำค้นหาทั้งหมด {len(filtered_books)} เล่ม ดังนี้ครับคุณท่าน:",
        color=discord.Color.dark_green()
    )
    
    for b in filtered_books[:10]:
        status = b.get('status')
        status_emoji = "❤️ อยากซื้อ" if status == "wishlist" else "📦 ซื้อแล้ว (ดอง)" if status == "bought" else "📖 กำลังอ่าน" if status == "reading" else "🎉 อ่านจบแล้ว"
        embed.add_field(
            name=f"📖 {b.get('title')} — {b.get('author')}",
            value=f"• **หมวดหมู่:** {b.get('category')} | **สถานะ:** {status_emoji}\n• **รายละเอียด:** {b.get('description', '—')}",
            inline=False
        )
        
    if len(filtered_books) > 10:
        embed.set_footer(text=f"แสดงผล 10 จากทั้งหมด {len(filtered_books)} เล่ม")
    else:
        embed.set_footer(text="มีข้อมูลใดให้กระผมบราฟาเอลตรวจสอบเพิ่มเติมนัดหมายแจ้งมาได้เลยครับ")
        
    await ctx.reply(embed=embed)

# คำสั่ง !routine แสดงตารางรูทีนชีวิต
@bot.command(name="routine")
async def routine_command(ctx, mode: str = "normal"):
    mode = mode.lower()
    if mode not in ["normal", "ot", "weekend"]:
        mode = "normal"
        
    schedule = data_helper.get_schedule(mode)
    mode_th = "โหมดวันทำงานปกติ 💼"
    if mode == "ot":
        mode_th = "โหมดทำงานล่วงเวลา (OT) 💼🔥"
    elif mode == "weekend":
        mode_th = "โหมดวันหยุดสุดสัปดาห์ 🎉"
        
    embed = discord.Embed(
        title=f"📅 ตารางเวลาของนายท่าน ({mode_th})",
        description="นี่คือแผนการใช้เวลาเพื่อประสิทธิภาพสูงสุดในแต่ละวันของคุณท่านครับกระผม:",
        color=discord.Color.blue()
    )
    for item in schedule:
        time_range = item.get("time")
        block_name = item.get("block")
        duration = item.get("duration")
        block_type = item.get("type", "normal")
        
        prefix = "🔹"
        if block_type == "work":
            prefix = "💼"
        elif block_type == "priority":
            prefix = "⭐"
        elif block_type == "sleep":
            prefix = "😴"
        elif block_type == "free":
            prefix = "🎉"
        elif block_type == "anki":
            prefix = "🧠"
            
        dur_str = f" ({duration})" if duration != "—" else ""
        embed.add_field(
            name=f"{prefix} {time_range}",
            value=f"**{block_name}**{dur_str}",
            inline=False
        )
    embed.set_footer(text="พิมพ์ !rules เพื่อตรวจสอบกฎเกณฑ์การทำภารกิจและรูทีนชีวิตครับกระผม")
    await ctx.reply(embed=embed)

# คำสั่ง !rules แสดงกฎเหล็ก
@bot.command(name="rules")
async def rules_command(ctx):
    rules = data_helper.get_routine_rules()
    embed = discord.Embed(
        title="📜 กฎเหล็กวินัยชีวิตของคุณท่าน",
        description="กระผมบราฟาเอลขอสรุปกฎกติกาส่วนตัวที่คุณท่านได้บัญญัติไว้เพื่อเตือนตนเองดังนี้ครับกระผม:",
        color=discord.Color.dark_red()
    )
    for idx, rule in enumerate(rules, 1):
        embed.add_field(name=f"ข้อที่ {idx}", value=rule, inline=False)
    embed.set_footer(text="วินัยเป็นกุญแจสำคัญสู่ความสำเร็จสูงสุดครับกระผม 🛡️")
    await ctx.reply(embed=embed)

# คำสั่ง !travel แนะนำที่เที่ยว
@bot.command(name="travel")
async def travel_command(ctx):
    spot = data_helper.get_random_travel_spot()
    if not spot:
        await ctx.reply("❌ ขออภัยครับคุณท่าน กระผมหาข้อมูลสถานที่ท่องเที่ยวไม่พบในระบบขณะนี้")
        return
        
    embed = discord.Embed(
        title=f"⛩️ แนะนำสถานที่พักผ่อน: {spot.get('name')}",
        description=spot.get('desc'),
        color=discord.Color.dark_green()
    )
    if spot.get("nameJP"):
        embed.add_field(name="🇯🇵 ชื่อญี่ปุ่น", value=spot.get("nameJP"), inline=True)
    embed.add_field(name="📍 ภูมิภาค/พิกัด", value=spot.get("region", "ไม่ระบุ"), inline=True)
    
    tags_str = ", ".join([f"#{t}" for t in spot.get("tags", [])])
    if tags_str:
        embed.add_field(name="🏷️ หมวดหมู่", value=tags_str, inline=False)
    embed.set_footer(text="ไปพักผ่อนเพื่อเติมพลังงานสมอง ยอดเยี่ยมที่สุดครับกระผม 🍃")
    
    if spot.get("image"):
        embed.set_image(url=spot.get("image"))
    await ctx.reply(embed=embed)

# ดักฟังข้อความสำหรับแชทบอทปกติใน DMs หรือ Mentions
@bot.event
async def on_message(message):
    if message.author == bot.user:
        return

    is_dm = message.guild is None
    is_mentioned = bot.user.mentioned_in(message)
    
    # --- [หน้าที่พิเศษ 1: การจัดการแสกนรูปภาพหน้าปกหนังสือ Multimodal Vision] ---
    if message.attachments:
        if is_mentioned or is_dm:
            for attachment in message.attachments:
                filename = attachment.filename.lower()
                # ตรวจรับสิทธิ์เฉพาะรูปภาพ
                if any(filename.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.webp']):
                    loading_msg = await message.reply("🔄 **ราฟาเอลกำลังนำภาพถ่ายปกหนังสือส่งหา Gemini Vision เพื่อแกะข้อมูลและคัดกรอง กรุณารอสักครู่ครับคุณท่าน...**")
                    try:
                        # ดาวน์โหลดข้อมูลภาพลงแรม
                        image_bytes = await attachment.read()
                        
                        # วิเคราะห์ข้อมูลปกหนังสือ (Title, Author, Desc, Category) ผ่าน Thread แยก
                        data = await asyncio.to_thread(secretary.analyze_book, image_bytes)
                        
                        if "error" in data:
                            await loading_msg.edit(content=f"❌ **ขอประทานอภัยครับ แสกนปกหนังสือขัดข้อง:** {data['message']}")
                            return
                            
                        await loading_msg.delete()
                        
                        # จัดทำ Embed โชว์ผลลัพธ์การแกะตัวหนังสือ
                        embed = discord.Embed(
                            title="📖 ตรวจพบหน้าปกหนังสือทางสายตาสำเร็จครับ!",
                            description="นี่คือรายละเอียดหนังสือที่ราฟาเอลแกะสแกนได้คุณท่านโปรดกดยืนยันเพื่อบันทึกเข้าเว็บครับ:",
                            color=discord.Color.green()
                        )
                        embed.add_field(name="📘 ชื่อหนังสือ", value=f"**{data.get('title')}**", inline=False)
                        embed.add_field(name="✍️ ผู้แต่ง/ผู้เขียน", value=data.get('author', 'ไม่ระบุ'), inline=True)
                        embed.add_field(name="📂 หมวดหมู่แนะนำ", value=data.get('category', 'ทั่วไป'), inline=True)
                        embed.add_field(name="📝 เรื่องย่อสำคัญ", value=data.get('desc', '—'), inline=False)
                        embed.set_footer(text="ราฟาเอลใช้โมเดลระดับสูง Gemini 2.5 Flash ในการอ่านหน้าปก")
                        
                        # มอบปุ่มโต้ตอบ UI ยืนยัน/ยกเลิก
                        view = ConfirmBookView(data, data_helper, message)
                        await message.reply(embed=embed, view=view)
                        return
                    except Exception as e:
                        await loading_msg.edit(content=f"❌ **ขอประทานอภัย เกิดข้อผิดพลาดของระบบบอท:** {str(e)}")
                        return

    # --- [หน้าที่พิเศษ 2: การโต้ตอบแชทปกติและดักเก็บข้อมูล JSON/SQL] ---
    if is_mentioned or is_dm:
        clean_content = message.content.strip()
        if is_mentioned:
            clean_content = clean_content.replace(f'<@!{bot.user.id}>', '').replace(f'<@{bot.user.id}>', '').strip()
            
        if not clean_content:
            await message.reply(
                "น้อมรับใช้ครับนายท่าน! กระผม 'ราฟาเอล' เลขาส่วนตัวของท่าน ยินดีให้ความช่วยเหลือ "
                "ท่านสามารถพิมพ์คุย สอบถามตารางงาน รูทีน เมนูอาหาร หรือสั่งจดบันทึกเก็บข้อมูลเข้าเว็บได้เลยครับ 🛡️💬"
            )
            return

        # ดึง Context ข้อมูลจริงส่งไปให้ Gemini
        today_date = datetime.datetime.now().strftime("%Y-%m-%d")
        day_name = datetime.datetime.now().strftime("%A")
        
        holiday_status = data_helper.is_holiday(today_date)
        holiday_info = f"เป็นวันหยุด: {holiday_status}" if holiday_status else "วันปกติ (ไม่ใช่เทศกาลหยุด)"
        
        todos = db.get_todos(status="pending")
        todos_summary = ", ".join([f"ID {t['id']}: {t['task']}" for t in todos]) if todos else "ไม่มีภารกิจค้างคา"
        
        context_data = {
            "เวลาปัจจุบันในโลกจริง": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + f" ({day_name})",
            "สถานะวันหยุด": holiday_info,
            "ภารกิจ Todo ที่ค้างอยู่ขณะนี้": todos_summary,
            "กฎเหล็กประจำตัวคุณท่าน": ", ".join(data_helper.get_routine_rules())
        }

        async with message.channel.typing():
            try:
                reply_text = await asyncio.wait_for(
                    asyncio.to_thread(secretary.chat, clean_content, message.author.name, context_data),
                    timeout=30.0
                )
            except asyncio.TimeoutError:
                await message.reply("🛡️ ขอประทานอภัยอย่างยิ่งครับคุณท่าน ระบบสมองกลขัดข้องชั่วคราว กรุณาเรียกกระผมใหม่อีกครั้งครับกระผม")
                return

            # --- [การดักวิเคราะห์คำสั่ง SAVE_ACTION จาก AI] ---
            action_match = re.search(r'\[\[SAVE_ACTION:\s*(.*?)\s*\]\]', reply_text, re.DOTALL)
            save_note = ""
            
            if action_match:
                try:
                    payload_str = action_match.group(1)
                    payload = json.loads(payload_str)
                    action_type = payload.get("type")
                    
                    success = False
                    # 1. จัดการชนิดเมนูอาหาร
                    if action_type == "menu":
                        success = data_helper.add_menu_item(
                            name=payload.get("name"),
                            description=payload.get("desc"),
                            calories=payload.get("calories", 500),
                            time=payload.get("time", 15),
                            nationality=payload.get("nationality", "thai")
                        )
                        save_note = f"\n\n✨ *[ระบบ]* บันทึกเมนูอาหาร **\"{payload.get('name')}\"** เข้าสู่ระบบเรียบร้อยครับกระผม!"
                        
                    # 2. จัดการชนิดเพลง
                    elif action_type == "music":
                        success = data_helper.add_music_song(
                            language_id=payload.get("lang", "thai"),
                            artist_name=payload.get("artist", "ไม่ระบุ"),
                            song_title=payload.get("title"),
                            url=payload.get("url"),
                            duration_secs=payload.get("duration", 200)
                        )
                        save_note = f"\n\n✨ *[ระบบ]* บันทึกเพลง **\"{payload.get('title')}\"** ของศิลปิน **{payload.get('artist')}** ลง Playlist บนเว็บเรียบร้อยครับกระผม!"
                        
                    # 3. จัดการชนิดท่องเที่ยว
                    elif action_type == "travel":
                        success = data_helper.add_travel_spot(
                            name=payload.get("name"),
                            description=payload.get("desc"),
                            region=payload.get("region", "toyama"),
                            name_jp=payload.get("name_jp")
                        )
                        save_note = f"\n\n✨ *[ระบบ]* บันทึกแหล่งท่องเที่ยวใหม่ **\"{payload.get('name')}\"** เข้าสู่หน้าเว็บเรียบร้อยครับกระผม!"
                        
                    # 4. จัดการชนิดหนังสือที่ควรอ่าน
                    elif action_type == "book":
                        success = data_helper.add_book(
                            title=payload.get("title"),
                            author=payload.get("author", "ไม่ระบุ"),
                            description=payload.get("desc", ""),
                            category=payload.get("category", "ทั่วไป")
                        )
                        save_note = f"\n\n✨ *[ระบบ]* บันทึกหนังสือ **\"{payload.get('title')}\"** ผู้เขียน **{payload.get('author')}** ลงฐานข้อมูลหน้าเว็บเรียบร้อยครับกระผม!"
                        
                    if not success:
                        save_note = "\n\n⚠️ *[ระบบ]* ตรวจพบข้อมูลเดิมมีอยู่ในระบบเว็บไซต์แล้ว จึงไม่มีการเขียนทับครับผม"
                        
                except Exception as e:
                    print(f"[OnMessage Save Error] {e}", flush=True)
                    save_note = f"\n\n❌ *[ระบบ]* การจดบันทึกลงหน้าเว็บขัดข้อง: {str(e)}"
                
                # ทำการลบโค้ด JSON block ออกไม่ให้โชว์ในห้องแชทให้เสียความหรูหรา
                reply_text = re.sub(r'\[\[SAVE_ACTION:\s*.*?\s*\]\]', '', reply_text, flags=re.DOTALL).strip()
            
            # ส่งคำตอบกลับคุณท่าน พร้อมหมายเหตุการบันทึก
            await message.reply(reply_text + save_note)
        return

    # เพื่อให้คำสั่ง Commands อื่นๆ ทำงานได้ปกติ
    await bot.process_commands(message)

# เริ่มรันระบบบอทราฟาเอล
if __name__ == "__main__":
    if config.DISCORD_BOT_TOKEN and "YOUR_RAPHAEL" not in config.DISCORD_BOT_TOKEN:
        bot.run(config.DISCORD_BOT_TOKEN)
    else:
        print("[ERROR] กรุณาตั้งค่า DISCORD_BOT_TOKEN ของราฟาเอลในไฟล์ .env ก่อนรันโปรแกรมครับกระผม!")
