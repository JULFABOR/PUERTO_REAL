import io
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import base64
from PIL import Image, ImageDraw, ImageFont
import os

# Default seaborn style
sns.set_style('darkgrid')


def plot_line_png(df, x_col, y_col, title='', figsize=(10, 4), color='#FFC700'):
    """
    Genera un PNG en memoria con un gráfico de línea y devuelve los bytes (tema oscuro).
    """
    fig, ax = plt.subplots(figsize=figsize, dpi=100)
    try:
        # Dark theme styling
        fig.patch.set_facecolor('#121212')
        ax.set_facecolor('#121212')
        sns.set_style('darkgrid', {'axes.facecolor': '#121212'})
        sns.lineplot(data=df, x=x_col, y=y_col, marker='o', ax=ax, color=color)
        ax.set_title(title, color='white')
        ax.set_xlabel(x_col, color='white')
        ax.set_ylabel(y_col, color='white')
        ax.tick_params(axis='x', rotation=45, colors='white')
        ax.tick_params(axis='y', colors='white')
        for spine in ax.spines.values():
            spine.set_color('#374151')
        plt.tight_layout()
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', facecolor=fig.get_facecolor())
        buf.seek(0)
        data = buf.read()
        buf.close()
        return data
    finally:
        plt.close(fig)


def plot_pie_png(labels, values, title='', figsize=(6, 6)):
    """
    Genera un PNG en memoria con un gráfico de torta y devuelve los bytes (tema oscuro).
    """
    fig, ax = plt.subplots(figsize=figsize, dpi=100)
    try:
        # Use palette that includes project yellow and complements
        base_palette = sns.color_palette('pastel').as_hex()
        palette = ['#FFC700'] + base_palette[1:]
        fig.patch.set_facecolor('#121212')
        ax.set_facecolor('#121212')
        ax.pie(values, labels=labels, autopct='%1.1f%%', startangle=90, colors=palette)
        ax.axis('equal')
        ax.set_title(title, color='white')
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
    Returns new PNG bytes.
    """
    try:
        img = Image.open(io.BytesIO(png_bytes)).convert('RGBA')
        txt = Image.new('RGBA', img.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(txt)
        try:
            font_path = os.path.join(os.path.dirname(__file__), 'fonts', 'DejaVuSans-Bold.ttf')
            font = ImageFont.truetype(font_path, fontsize)
        except Exception:
            font = ImageFont.load_default()

        text_w, text_h = draw.textsize(text, font=font)
        padding = 10
        position = (img.width - text_w - padding, img.height - text_h - padding)
        # RGBA color with opacity
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
        # if watermarking fails, return original bytes
        print('Warning: watermark failed:', e)
        return png_bytes
