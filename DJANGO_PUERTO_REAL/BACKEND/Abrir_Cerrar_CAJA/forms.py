from django import forms
from decimal import Decimal

class AperturaCajaForm(forms.Form):
    monto_inicial = forms.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01'),
        label="Monto Inicial"
    )
    desc_ajuste = forms.CharField(
        max_length=255,
        required=False,
        label="Descripción del Ajuste (opcional)"
    )

    def __init__(self, *args, **kwargs):
        monto_sugerido = kwargs.pop('monto_sugerido', None)
        super().__init__(*args, **kwargs)
        if monto_sugerido is not None:
            self.fields['monto_inicial'].initial = monto_sugerido

class RetiroEfectivoForm(forms.Form):
    monto_retiro = forms.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01'),
        label="Monto a Retirar"
    )
    motivo = forms.CharField(
        max_length=255,
        label="Motivo del Retiro"
    )
    destino = forms.CharField( # Could be a ChoiceField if options are known
        max_length=50,
        label="Destino (depósito/fondo)"
    )
    aprobador = forms.CharField(
        max_length=100,
        required=False,
        label="Aprobador (opcional)"
    )

class RendirFondoForm(forms.Form):
    monto_a_devolver = forms.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01'),
        label="Monto a Devolver"
    )

    def __init__(self, *args, **kwargs):
        saldo_fondo = kwargs.pop('saldo_fondo', None)
        super().__init__(*args, **kwargs)
        # You might want to use saldo_fondo for validation or display,
        # but it's not a field itself.
        # For example, you could add a clean method for validation:
        # def clean_monto_a_devolver(self):
        #     monto = self.cleaned_data['monto_a_devolver']
        #     if saldo_fondo is not None and monto > saldo_fondo:
        #         raise forms.ValidationError("El monto a devolver no puede ser mayor al saldo del fondo.")
        #     return monto