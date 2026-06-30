import discord
from discord.ext import commands
import asyncio
import os
from keep_alive import keep_alive

# Configuration
PREFIX = "/"

intents = discord.Intents.all()
bot = commands.Bot(command_prefix=PREFIX, intents=intents, help_command=None)

# Vérification des permissions administrateur
def is_admin():
    async def predicate(ctx):
        return ctx.author.guild_permissions.administrator
    return commands.check(predicate)

# === COMMANDES DE MASSE ===

@bot.command(name="unball")
@is_admin()
async def unball_all(ctx):
    """Retire tous les rôles à tous les membres"""
    await ctx.message.delete()
    msg = await ctx.send("🔄 Retrait de tous les rôles à tous les membres...")
    
    guild = ctx.guild
    count = 0
    errors = 0
    
    for member in guild.members:
        if member == bot.user:
            continue
        try:
            await member.edit(roles=[])
            count += 1
            await asyncio.sleep(0.5)
        except:
            errors += 1
    
    await msg.edit(content=f"✅ Tous les rôles retirés à **{count}** membres. Erreurs: {errors}")

@bot.command(name="addrole")
@is_admin()
async def addrole_all(ctx, role: discord.Role = None):
    """Ajoute un rôle à tous les membres"""
    await ctx.message.delete()
    
    if role is None:
        return await ctx.send("❌ Utilisation: `/addrole @role`")
    
    msg = await ctx.send(f"🔄 Ajout du rôle **{role.name}** à tous les membres...")
    
    guild = ctx.guild
    count = 0
    errors = 0
    
    for member in guild.members:
        if role in member.roles:
            continue
        try:
            await member.add_roles(role)
            count += 1
            await asyncio.sleep(0.3)
        except:
            errors += 1
    
    await msg.edit(content=f"✅ Rôle **{role.name}** ajouté à **{count}** membres. Erreurs: {errors}")

@bot.command(name="nickname")
@is_admin()
async def nickname_all(ctx, *, nickname: str = None):
    """Change le pseudo de tous les membres"""
    await ctx.message.delete()
    
    if nickname is None:
        return await ctx.send("❌ Utilisation: `/nickname nouveau_pseudo`")
    
    msg = await ctx.send(f"🔄 Changement du pseudo de tous les membres en **{nickname}**...")
    
    guild = ctx.guild
    count = 0
    errors = 0
    
    for member in guild.members:
        if member == bot.user or member == guild.owner:
            continue
        try:
            await member.edit(nick=nickname)
            count += 1
            await asyncio.sleep(0.3)
        except:
            errors += 1
    
    await msg.edit(content=f"✅ Pseudo changé pour **{count}** membres. Erreurs: {errors}")

@bot.command(name="resetnick")
@is_admin()
async def nickname_reset_all(ctx):
    """Réinitialise le pseudo de tous les membres"""
    await ctx.message.delete()
    msg = await ctx.send("🔄 Réinitialisation des pseudos de tous les membres...")
    
    guild = ctx.guild
    count = 0
    errors = 0
    
    for member in guild.members:
        if member == bot.user or member == guild.owner:
            continue
        try:
            await member.edit(nick=None)
            count += 1
            await asyncio.sleep(0.3)
        except:
            errors += 1
    
    await msg.edit(content=f"✅ Pseudos réinitialisés pour **{count}** membres. Erreurs: {errors}")

@bot.command(name="timeout")
@is_admin()
async def timeout_all(ctx, duration: int = 5):
    """Met tous les membres en timeout (durée en minutes, défaut: 5)"""
    await ctx.message.delete()
    msg = await ctx.send(f"⏳ Mise en timeout de tous les membres pour **{duration} min**...")
    
    guild = ctx.guild
    timeout_until = discord.utils.utcnow() + discord.timedelta(minutes=duration)
    count = 0
    errors = 0
    
    for member in guild.members:
        if member == bot.user or member == guild.owner:
            continue
        try:
            await member.timeout(timeout_until)
            count += 1
            await asyncio.sleep(0.3)
        except:
            errors += 1
    
    await msg.edit(content=f"⏳ **{count}** membres mis en timeout pendant {duration} min. Erreurs: {errors}")

@bot.command(name="untimeout")
@is_admin()
async def untimeout_all(ctx):
    """Retire le timeout de tous les membres"""
    await ctx.message.delete()
    msg = await ctx.send("🔄 Retrait du timeout de tous les membres...")
    
    guild = ctx.guild
    count = 0
    errors = 0
    
    for member in guild.members:
        try:
            await member.timeout(None)
            count += 1
            await asyncio.sleep(0.3)
        except:
            errors += 1
    
    await msg.edit(content=f"✅ Timeout retiré pour **{count}** membres. Erreurs: {errors}")

@bot.command(name="moveall")
@is_admin()
async def moveall_to(ctx, channel: discord.VoiceChannel = None):
    """Déplace tous les membres d'un salon vocal vers un autre"""
    await ctx.message.delete()
    
    if channel is None:
        return await ctx.send("❌ Utilisation: `/moveall #salon-vocal`")
    
    msg = await ctx.send(f"🔄 Déplacement de tous les membres vers **{channel.name}**...")
    
    count = 0
    errors = 0
    
    for vc in ctx.guild.voice_channels:
        for member in vc.members:
            try:
                await member.move_to(channel)
                count += 1
                await asyncio.sleep(0.3)
            except:
                errors += 1
    
    await msg.edit(content=f"✅ **{count}** membres déplacés vers **{channel.name}**. Erreurs: {errors}")

@bot.command(name="disconnectall")
@is_admin()
async def disconnect_all(ctx):
    """Déconnecte tous les membres des salons vocaux"""
    await ctx.message.delete()
    msg = await ctx.send("🔄 Déconnexion de tous les membres des salons vocaux...")
    
    count = 0
    errors = 0
    
    for vc in ctx.guild.voice_channels:
        for member in vc.members:
            try:
                await member.move_to(None)
                count += 1
                await asyncio.sleep(0.3)
            except:
                errors += 1
    
    await msg.edit(content=f"✅ **{count}** membres déconnectés des salons vocaux. Erreurs: {errors}")

@bot.command(name="lock")
@is_admin()
async def lock_all(ctx):
    """Verrouille tous les salons texte"""
    await ctx.message.delete()
    msg = await ctx.send("🔒 Verrouillage de tous les salons...")
    
    guild = ctx.guild
    count = 0
    errors = 0
    
    for channel in guild.text_channels:
        try:
            await channel.set_permissions(guild.default_role, send_messages=False)
            count += 1
        except:
            errors += 1
    
    await msg.edit(content=f"🔒 **{count}** salons verrouillés. Erreurs: {errors}")

@bot.command(name="unlock")
@is_admin()
async def unlock_all(ctx):
    """Déverrouille tous les salons texte"""
    await ctx.message.delete()
    msg = await ctx.send("🔓 Déverrouillage de tous les salons...")
    
    guild = ctx.guild
    count = 0
    errors = 0
    
    for channel in guild.text_channels:
        try:
            await channel.set_permissions(guild.default_role, send_messages=True)
            count += 1
        except:
            errors += 1
    
    await msg.edit(content=f"🔓 **{count}** salons déverrouillés. Erreurs: {errors}")

@bot.command(name="clear")
@is_admin()
async def clear_all(ctx, limit: int = 10):
    """Supprime un nombre de messages dans tous les salons"""
    await ctx.message.delete()
    msg = await ctx.send(f"🗑️ Suppression de **{limit}** messages dans tous les salons...")
    
    guild = ctx.guild
    total = 0
    errors = 0
    
    for channel in guild.text_channels:
        try:
            deleted = await channel.purge(limit=limit, bulk=True)
            total += len(deleted)
            await asyncio.sleep(1)
        except:
            errors += 1
    
    await msg.edit(content=f"🗑️ **{total}** messages supprimés. Salons en erreur: {errors}")

@bot.command(name="modif")
@is_admin()
async def modifier_serveur(ctx, *, options: str = None):
    """Modifie le nom et/ou la description du serveur
    Utilisation: /modif nom:NouveauNom desc:NouvelleDescription
    """
    await ctx.message.delete()
    
    if options is None:
        return await ctx.send("❌ Utilisation: `/modif nom:NouveauNom desc:NouvelleDescription`")
    
    guild = ctx.guild
    modifications = {}
    
    # Analyse les options
    parts = options.split()
    for part in parts:
        if part.startswith("nom:"):
            modifications["name"] = part[4:]
        elif part.startswith("desc:"):
            modifications["description"] = part[5:]
    
    if not modifications:
        return await ctx.send("❌ Utilisation: `/modif nom:NouveauNom desc:NouvelleDescription`")
    
    try:
        await guild.edit(**modifications)
        msg_parts = []
        if "name" in modifications:
            msg_parts.append(f"nom → **{modifications['name']}**")
        if "description" in modifications:
            msg_parts.append(f"description → **{modifications['description']}**")
        
        await ctx.send(f"✅ Serveur modifié : {', '.join(msg_parts)}")
    except Exception as e:
        await ctx.send(f"❌ Erreur: {str(e)}")

@bot.command(name="unban")
@is_admin()
async def unban_all(ctx):
    """Débannit tous les utilisateurs bannis du serveur"""
    await ctx.message.delete()
    
    confirm = await ctx.send("⚠️ Voulez-vous vraiment débannir **TOUS** les membres bannis ? Tapez `oui` dans les 10 secondes.")
    
    def check(m):
        return m.author == ctx.author and m.content.lower() == "oui"
    
    try:
        await bot.wait_for("message", timeout=10.0, check=check)
    except asyncio.TimeoutError:
        return await confirm.edit(content="❌ Commande annulée.")
    
    msg = await ctx.send("🔄 Débannissement de tous les utilisateurs...")
    
    guild = ctx.guild
    count = 0
    errors = 0
    
    try:
        async for ban_entry in guild.bans():
            try:
                await guild.unban(ban_entry.user)
                count += 1
                await asyncio.sleep(0.3)
            except:
                errors += 1
    except discord.Forbidden:
        return await msg.edit(content="❌ Le bot n'a pas la permission de bannir/débannir.")
    
    await msg.edit(content=f"✅ **{count}** utilisateurs débannis. Erreurs: {errors}")

@bot.command(name="help")
async def help_command(ctx):
    """Affiche l'aide du bot"""
    embed = discord.Embed(
        title="📋 Commandes du Bot",
        description="Bot de gestion de masse pour serveur Discord",
        color=discord.Color.blue()
    )
    
    embed.add_field(
        name="👥 Gestion des membres",
        value="`/unball` - Retire tous les rôles à tous\n"
              "`/addrole @role` - Ajoute un rôle à tous\n"
              "`/nickname pseudo` - Change le pseudo de tous\n"
              "`/resetnick` - Réinitialise tous les pseudos\n"
              "`/timeout minutes` - Timeout tous les membres\n"
              "`/untimeout` - Retire le timeout à tous\n"
              "`/unban` - Débannit tous les utilisateurs bannis",
        inline=False
    )
    
    embed.add_field(
        name="🔊 Salons vocaux",
        value="`/moveall #salon` - Déplace tous vers un salon\n"
              "`/disconnectall` - Déconnecte tous du vocal",
        inline=False
    )
    
    embed.add_field(
        name="🔒 Gestion des salons",
        value="`/lock` - Verrouille tous les salons\n"
              "`/unlock` - Déverrouille tous les salons\n"
              "`/clear nombre` - Supprime des messages partout",
        inline=False
    )
    
    embed.add_field(
        name="⚙️ Gestion du serveur",
        value="`/modif nom:Nom desc:Description` - Modifie le serveur",
        inline=False
    )
    
    embed.set_footer(text="Réservé aux administrateurs du serveur")
    
    await ctx.send(embed=embed)

# === ÉVÉNEMENTS ===

@bot.event
async def on_ready():
    print(f"✅ Bot connecté: {bot.user}")
    print(f"📊 {len(bot.guilds)} serveur(s) connecté(s)")
    print(f"⚡ Prefix: {PREFIX}")
    for guild in bot.guilds:
        print(f"   → {guild.name} (ID: {guild.id})")

@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.MissingPermissions):
        await ctx.send("❌ Vous devez être administrateur pour utiliser cette commande.")
    elif isinstance(error, commands.BotMissingPermissions):
        await ctx.send("❌ Le bot n'a pas les permissions nécessaires.")
    elif isinstance(error, commands.CommandNotFound):
        pass
    else:
        await ctx.send(f"❌ Erreur: {str(error)}")

# === DÉMARRAGE ===
if __name__ == "__main__":
    keep_alive()
    bot.run("MTUxNTk5MTQ0ODgzNzY4NTMwOA.G4G2BV.hnLkBk8dBNTN-mHAC1DQ2I2lWTBGxexr78CTAA")