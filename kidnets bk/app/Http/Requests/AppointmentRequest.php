<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AppointmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => 'required|in:usual,phone',
            'patient_id' => 'required_if:type,usual|integer|exists:patients,id|nullable',
            'phone' => 'nullable|required_if:type,phone|string|max:20',
            'date' => ['required', 'date', 'after_or_equal:today'],
            'note' => 'nullable|string|max:255',
        ];
    }

    public function messages()
    {
        return [
            'type.required' => 'Le type de rendez-vous est requis.',
            'type.in' => 'Le type de rendez-vous doit être "usual" ou "phone".',
            'patient_id.required_if' => 'Le patient est requis pour un rendez-vous en personne.',
            'patient_id.exists' => 'Le patient sélectionné est invalide.',
            'phone.required_if' => 'Le numéro de téléphone est requis pour un rendez-vous téléphonique.',
            'date.required' => 'La date est requise.',
            'date.date' => 'La date doit être une date valide.',
            'date.after_or_equal' => 'La date doit être égale ou postérieure à la date actuelle.',
            'note.string' => 'La note doit être une chaîne de caractères.',
            'note.max' => 'La note ne peut pas dépasser 255 caractères.',
        ];
    }
}
