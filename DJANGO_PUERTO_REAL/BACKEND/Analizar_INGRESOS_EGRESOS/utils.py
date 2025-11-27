import io
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import base64
import os
try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except Exception:
    PIL_AVAILABLE = False

# Default seaborn style
sns.set_style('darkgrid')


def plot_line_png(df, x_col, y_col, title='', figsize=(10, 4), color='#FFC700'):
    """
    Genera un PNG en memoria con un gráfico de línea y devuelve los bytes (tema claro para PDF).
    """
    fig, ax = plt.subplots(figsize=figsize, dpi=100)
    try:
        # Light theme styling (better for PDF)
        fig.patch.set_facecolor('#FFFFFF')
        ax.set_facecolor('#f8f9fa')
        sns.set_style('whitegrid', {'axes.facecolor': '#f8f9fa'})
        sns.lineplot(data=df, x=x_col, y=y_col, marker='o', ax=ax, color=color, linewidth=2.5, markersize=6)
        ax.set_title(title, color='#2c3e50', fontsize=14, fontweight='bold')
        ax.set_xlabel(x_col, color='#555')
        ax.set_ylabel(y_col, color='#555')
        ax.tick_params(axis='x', rotation=45, colors='#555')
        ax.tick_params(axis='y', colors='#555')
        ax.grid(True, color='#e0e0e0', linestyle='--', alpha=0.6)
        for spine in ax.spines.values():
            spine.set_color('#d0d0d0')
        plt.tight_layout()
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', facecolor=fig.get_facecolor())
        buf.seek(0)
        data = buf.read()
        buf.close()
        return data
    finally:
        plt.close(fig)


def plot_pie_png(labels, values, title='', figsize=(8, 8)):
    """
    Genera un PNG en memoria con un gráfico de torta y devuelve los bytes (tema claro para PDF).
    """
    fig, ax = plt.subplots(figsize=figsize, dpi=100)
    try:
        # Colores profesionales que incluyen el amarillo de marca
        colors = ['#FFC700', '#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f39c12', '#1abc9c', '#34495e']
        # Extender si hay más categorías
        while len(colors) < len(labels):
            colors.extend(colors)
        colors = colors[:len(labels)]
        
        fig.patch.set_facecolor('#FFFFFF')
        ax.set_facecolor('#FFFFFF')
        
        # Crear pie chart con bordes visibles
        wedges, texts, autotexts = ax.pie(
            values, 
            labels=labels, 
            autopct='%1.1f%%',
            startangle=90,
            colors=colors,
            textprops={'fontsize': 10, 'color': '#2c3e50'},
            wedgeprops={'edgecolor': '#FFFFFF', 'linewidth': 2}
        )
        
        # Mejorar textos de porcentajes
        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_fontweight('bold')
            autotext.set_fontsize(9)
        
        # Mejorar textos de labels
        for text in texts:
            text.set_color('#2c3e50')
            text.set_fontweight('bold')
            text.set_fontsize(10)
        
        ax.axis('equal')
        ax.set_title(title, color='#2c3e50', fontsize=14, fontweight='bold', pad=20)
        
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', facecolor=fig.get_facecolor())
        buf.seek(0)
        data = buf.read()
        buf.close()
        return data
    finally:
        plt.close(fig)


def to_base64_png(png_bytes):
    return base64.b64encode(png_bytes).decode('utf-8')


def add_watermark(png_bytes, text='PUERTO REAL', opacity=120, fontsize=14, color=(255, 199, 0)):
    """Add a small watermark text to the bottom-right of a PNG image (bytes).
    Returns new PNG bytes. If Pillow is not available, returns original bytes.
    """
    if not PIL_AVAILABLE:
        # Pillow not installed; skip watermarking
        return png_bytes

    try:
        img = Image.open(io.BytesIO(png_bytes)).convert('RGBA')
        txt = Image.new('RGBA', img.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(txt)
        try:
            font_path = os.path.join(os.path.dirname(__file__), 'fonts', 'DejaVuSans-Bold.ttf')
            font = ImageFont.truetype(font_path, fontsize)
        except Exception:
            font = ImageFont.load_default()

        # compute text size
        try:
            text_w, text_h = draw.textsize(text, font=font)
        except Exception:
            # Pillow versions may differ; fallback
            text_w, text_h = (len(text) * fontsize * 0.6, fontsize)

        padding = 10
        position = (max(0, img.width - int(text_w) - padding), max(0, img.height - int(text_h) - padding))
        watermark_color = color + (opacity,)
        draw.text(position, text, font=font, fill=watermark_color)
        out = Image.alpha_composite(img, txt)
        buf = io.BytesIO()
        out.convert('RGB').save(buf, format='PNG')
        buf.seek(0)
        data = buf.read()
        buf.close()
        return data
    except Exception as e:
        # If watermarking fails, return original bytes
        print('Warning: watermark failed:', e)
        return png_bytes



