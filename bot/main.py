import discord
from discord.ext import commands
import config
from src.gemini_analyzer import GeminiAnalyzer
from src.radetch_api import RadetchAPI
import sys

# บังคับใช้ UTF-8 สำหรับแสดงผลใน Terminal ของ Windows ป้องกัน UnicodeEncodeError
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass # ป้องกันกรณี Python เวอร์ชันเก่าที่ไม่มี reconfigure


# กำหนดสิทธิ์การทำงานของบอท Discord (Intents)
intents = discord.Intents.default()
# จำเป็นต้องเปิดสิทธิ์ Message Content ใน Discord Developer Portal เพื่อให้อ่านภาพ/ข้อความได้
intents.message_content = True 

bot = commands.Bot(command_prefix="!", intents=intents)

# เริ่มต้นตัวเชื่อมต่อระบบ
analyzer = GeminiAnalyzer(config.GEMINI_API_KEY)
db = RadetchAPI(config.RADETCH_API_URL)

# สร้างปุ่มสำหรับยืนยันหรือยกเลิกการบันทึกข้อมูล
class ConfirmView(discord.ui.View):
    def __init__(self, data, db_helper, placeholder_message):
        super().__init__(timeout=60.0)  # ตั้งเวลาหมดอายุของปุ่ม 1 นาที
        self.data = data
        self.db = db_helper
        self.placeholder_message = placeholder_message

    @discord.ui.button(label="ยืนยันบันทึกข้อมูล", style=discord.ButtonStyle.green, emoji="✅")
    async def confirm(self, interaction: discord.Interaction, button: discord.ui.Button):
        # โหมด Defer เพื่อรอระบบบันทึกสักครู่
        await interaction.response.defer()
        
        # บันทึกข้อมูล
        success = self.db.insert_transaction(self.data)
        
        if success:
            # แก้ไขปุ่มและข้อความเมื่อบันทึกเสร็จ
            for child in self.children:
                child.disabled = True
            await interaction.message.edit(view=self)
            await interaction.followup.send("🎉 บันทึกข้อมูลเข้าสู่ระบบ RaDeTCh สำเร็จแล้ว!", ephemeral=False)

        else:
            await interaction.followup.send("❌ บันทึกข้อมูลล้มเหลว กรุณาตรวจสอบการตั้งค่าหลังบ้าน", ephemeral=True)
        
        self.stop()

    @discord.ui.button(label="ยกเลิก", style=discord.ButtonStyle.red, emoji="❌")
    async def cancel(self, interaction: discord.Interaction, button: discord.ui.Button):
        for child in self.children:
            child.disabled = True
        await interaction.message.edit(view=self)
        await interaction.response.send_message("❌ ยกเลิกรายการแล้ว ข้อมูลจะไม่ถูกจัดเก็บ", ephemeral=False)
        self.stop()

@bot.event
async def on_ready():
    print(f"=== บอท BotBas พร้อมทำงานแล้ว! ===", flush=True)
    print(f"ล็อกอินในชื่อ: {bot.user.name} ({bot.user.id})", flush=True)
    print(f"เชื่อมต่อ API ไปยัง RaDeTCh: {db.base_url}", flush=True)
    print("=" * 35, flush=True)


@bot.event
async def on_message(message):
    # ป้องกันไม่ให้บอทอ่านข้อความตัวเอง
    if message.author == bot.user:
        return

    # เพิ่มจุด Debug ล็อกเพื่อเช็กว่าบอทรับข้อความเข้ามาหรือไม่ (ป้องกันปัญหาลืมเปิด Message Intent)
    print(f"[DEBUG] ได้รับข้อความจาก {message.author}: '{message.content}' (มีไฟล์แนบ: {len(message.attachments)} ไฟล์)", flush=True)

    # ตรวจสอบหากเป็นข้อความตัวหนังสือทั่วไป (ไม่มีไฟล์แนบ) และมีการกล่าวถึงบอท (Mention) หรือแชทส่วนตัว (DM)
    if not message.attachments:
        content = message.content.strip()
        
        # 1. เช็กคำสั่งขอคู่มือช่วยเหลือหรือตรวจสอบสถานะระบบ
        if content.lower() in ["!help", "!status", "help", "คู่มือ", "วิธีใช้"]:
            help_embed = discord.Embed(
                title="🤖 ยินดีต้อนรับสู่ระบบ BotBas!",
                description="ผมคือ AI บอทผู้ช่วยอัจฉริยะที่เชื่อมโยงพอร์ตการลงทุนของคุณเข้าสู่เว็บไซต์ **RaDeTCh**",
                color=discord.Color.blue()
            )
            help_embed.add_field(
                name="📸 วิธีบันทึกธุรกรรมด้วยสลิป", 
                value="เพียงคุณทำการ **อัปโหลดภาพแคปเจอร์สลิปการเทรด (หุ้นหรือ Crypto)** เข้ามาในห้องแชทนี้ ผมจะใช้ Gemini AI แกะข้อมูลตัวเลขให้ และมีปุ่มให้คุณกดยืนยันบันทึกเข้าเว็บ RaDeTCh ทันที!", 
                inline=False
            )
            help_embed.add_field(
                name="💬 คุยกับบอทปกติ",
                value="คุณสามารถ **พิมพ์คุย, ถามคำถามการลงทุน หรือคุยเล่น** กับผมได้เหมือนแชทบอทปกติเลยครับ! เพียงแค่ @แท็กเรียกชื่อผม หรือคุยแชทส่วนตัว (DM) เข้ามาหาผมได้ทันทีครับ",
                inline=False
            )
            help_embed.add_field(
                name="🌐 เว็บไซต์ปลายทาง", 
                value=f"ปัจจุบันเชื่อมระบบเข้ากับ: `{db.base_url}`", 
                inline=False
            )
            help_embed.set_footer(text="ลองส่งรูปภาพสลิปจริง หรือลองคุยกับผมได้เลยครับ!")
            await message.reply(embed=help_embed)
            return

        # 2. คุยกับบอทเหมือนแชทบอทปกติ (ถ้าโดน Mention ในเซิร์ฟเวอร์ หรือพิมพ์คุยใน DM ส่วนตัว)
        is_dm = message.guild is None
        is_mentioned = bot.user.mentioned_in(message)
        
        if is_mentioned or is_dm:
            # คลีนข้อความโดยเอาแท็ก Mention ของตัวบอทออก เพื่อไม่ให้ไปกวน AI
            clean_content = content
            if is_mentioned:
                clean_content = clean_content.replace(f'<@!{bot.user.id}>', '').replace(f'<@{bot.user.id}>', '').strip()
                
            # ป้องกันกรณีผู้ใช้กดแท็ก Mention เฉยๆ โดยไม่ได้พิมพ์อะไรต่อ
            if not clean_content:
                await message.reply("สวัสดีครับ! มีอะไรให้บอทบาสช่วยคุณวันนี้ไหมครับ? พิมพ์ถามเรื่องหุ้น คริปโต หรือเรื่องทั่วไปได้เลยนะ! 🤖💬")
                return
                
            # แสดงสถานะ "กำลังพิมพ์..." (Typing...) ใน Discord เพื่อเพิ่มความเป็นธรรมชาติ
            async with message.channel.typing():
                # ส่งคำพูดไปให้ Gemini คุยตอบกลับมา
                reply_text = analyzer.chat(clean_content)
                await message.reply(reply_text)
            return


    # ตรวจสอบว่าในข้อความมีการส่งไฟล์ภาพแนบมาหรือไม่
    if message.attachments:
        for attachment in message.attachments:
            # คัดกรองเฉพาะไฟล์ภาพ
            filename = attachment.filename.lower()
            if any(filename.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.webp']):
                print(f"[DEBUG] ตรวจพบไฟล์รูปภาพธุรกรรม: {filename} กำลังเริ่มประมวลผล...", flush=True)
                
                # ส่งข้อความแจ้งให้ผู้ใช้ทราบว่าเริ่มวิเคราะห์แล้ว

                loading_msg = await message.reply("🔄 **AI กำลังเริ่มวิเคราะห์สลิปธุรกรรมของคุณ กรุณารอสักครู่...**")
                
                try:
                    # ดาวน์โหลดไฟล์ภาพมาในแรม (Memory)
                    image_bytes = await attachment.read()
                    
                    # ส่งรูปภาพไปวิเคราะห์ด้วย Gemini
                    data = analyzer.analyze_transaction(image_bytes)
                    
                    if "error" in data:
                        await loading_msg.edit(content=f"❌ **เกิดข้อผิดพลาดในการแกะข้อมูล:** {data['message']}")
                        return
                    
                    # ลบข้อความกำลังวิเคราะห์ออก
                    await loading_msg.delete()
                    
                    # จัดฟอร์แมตข้อมูลสำหรับแสดงผล
                    tx_type = data.get("transaction_type", "BUY")
                    tx_str = "🟢 ซื้อ (BUY)" if tx_type == "BUY" else "🔴 ขาย (SELL)"
                    
                    # สร้างการ์ดสวยงาม (Embed) โชว์ผลลัพธ์ที่ AI ดึงออกมาได้
                    embed = discord.Embed(
                        title="🔍 ผลการตรวจสอบสลิปด้วย AI",
                        description="กรุณาตรวจสอบความถูกต้องของข้อมูลด้านล่างนี้ก่อนบันทึกลงฐานข้อมูล",
                        color=discord.Color.blue() if tx_type == "BUY" else discord.Color.red()
                    )
                    
                    embed.add_field(name="📊 สินทรัพย์ (Asset)", value=f"**{data.get('asset', 'ไม่ระบุ')}**", inline=True)
                    embed.add_field(name="🔄 ประเภท (Type)", value=tx_str, inline=True)
                    embed.add_field(name="🏢 แพลตฟอร์ม (Platform)", value=data.get("platform", "ไม่ระบุ"), inline=True)
                    
                    # แสดงผลตัวเลข จัดทศนิยมให้สวยงาม
                    price = data.get("price")
                    price_str = f"{price:,.2f}" if isinstance(price, (int, float)) else "ไม่ระบุ"
                    embed.add_field(name="💵 ราคาต่อหน่วย", value=price_str, inline=True)
                    
                    qty = data.get("quantity")
                    qty_str = f"{qty:,}" if isinstance(qty, (int, float)) else "ไม่ระบุ"
                    embed.add_field(name="📦 จำนวน (Quantity)", value=qty_str, inline=True)
                    
                    total = data.get("total_amount")
                    total_str = f"{total:,.2f}" if isinstance(total, (int, float)) else "ไม่ระบุ"
                    embed.add_field(name="💰 รวมยอดเงินเงิน", value=f"**{total_str}**", inline=True)
                    
                    embed.add_field(name="📅 วันเวลาทำรายการ", value=data.get("timestamp", "ไม่ระบุ"), inline=False)
                    embed.set_footer(text="บอทใช้โมเดล Gemini 1.5 Flash ในการประมวลผลสลิป")
                    
                    # ส่งการ์ดพร้อมปุ่มยันยันข้อมูล
                    view = ConfirmView(data, db, message)
                    await message.reply(embed=embed, view=view)
                    
                except Exception as e:
                    await loading_msg.edit(content=f"❌ **ขออภัย เกิดข้อผิดพลาดของระบบบอท:** {str(e)}")

    # อนุญาตให้คำสั่ง Commands อื่นๆ (หากมี) ทำงานต่อได้ตามปกติ
    await bot.process_commands(message)

# รันบอท
if __name__ == "__main__":
    if config.DISCORD_BOT_TOKEN:
        bot.run(config.DISCORD_BOT_TOKEN)
    else:
        print("[ERROR] กรุณาตั้งค่า DISCORD_BOT_TOKEN ในไฟล์ .env ก่อนทำการรันโปรแกรม")

