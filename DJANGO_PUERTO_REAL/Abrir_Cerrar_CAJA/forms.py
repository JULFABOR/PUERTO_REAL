from decimal import Decimal
from django import forms

MIN_MONTO = Decimal("0.00")  # ajusta tu mínimo real

class AperturaCajaForm(forms.Form):
    monto_inicial = forms.DecimalField(min_value=MIN_MONTO, max_digits=10, decimal_places=2)
    desc_ajuste = forms.CharField(required=False, max_length=200)

    def __init__(self, *args, monto_sugerido=Decimal("0.00"), **kwargs):
        super().__init__(*args, **kwargs)
        self.monto_sugerido = Decimal(monto_sugerido or 0)
        self.fields['monto_inicial'].initial = self.monto_sugerido

    def clean(self):
        cleaned = super().clean()
        monto_inicial = cleaned.get("monto_inicial")
        desc_ajuste = (cleaned.get("desc_ajuste") or "").strip()
        if monto_inicial is None:
            return cleaned
        if monto_inicial != self.monto_sugerido and not desc_ajuste:
            self.add_error("desc_ajuste", "Explique el ajuste si difiere del sugerido.")
        return cleaned


class RetiroEfectivoForm(forms.Form):
    DESTINOS = (
        ("deposito", "Depositar/otros"),
        ("fondo", "Para pagos (Fondo)"),
    )
    monto_retiro = forms.DecimalField(min_value=Decimal("0.01"), max_digits=10, decimal_places=2)
    motivo = forms.CharField(max_length=200)
    destino = forms.ChoiceField(choices=DESTINOS)
    aprobador = forms.CharField(required=False, max_length=100)


class RendirFondoForm(forms.Form):
    monto_a_devolver = forms.DecimalField(min_value=Decimal("0.00"), max_digits=12, decimal_places=2)

    def __init__(self, *args, saldo_fondo=Decimal("0.00"), **kwargs):
        super().__init__(*args, **kwargs)
        self.saldo_fondo = Decimal(saldo_fondo or 0)
        # para HTML5 (no valida en backend, sólo UI)
        self.fields['monto_a_devolver'].widget.attrs['max'] = str(self.saldo_fondo)

    def clean_monto_a_devolver(self):
        v = self.cleaned_data['monto_a_devolver']
        if v > self.saldo_fondo:
            raise forms.ValidationError("No puede devolver más que el saldo del Fondo.")
        return v
