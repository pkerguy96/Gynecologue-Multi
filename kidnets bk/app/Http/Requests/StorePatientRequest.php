<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class StorePatientRequest extends FormRequest
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
        $patientId = $this->route('id');
        Log::info($patientId);
        return [
            'nom' => ['required'],
            'prenom' => ['required'],
            'cin' => 'nullable',
            'date' => [
                'required',
                'date',
                'before_or_equal:today',
            ],
            'address' => ['required'],
            'sex' => ['required', Rule::in(['male', 'female'])],
            'phone_number' => [
                'required',
                'numeric',
                'digits_between:8,12',
                Rule::unique('patients')
                    ->where(fn($query) => $query->where('doctor_id', $this->input('doctor_id')))
                    ->ignore($patientId),
            ],
            'mutuelle' => ['required'],
            'allergy' => ['nullable', 'string'],
            'disease' => ['nullable', 'string'],
            'referral' => ['nullable', 'string'],
            'note' => ['nullable', 'string'],
            'children' => ['nullable', 'array'],
            'children.*.dob' => ['nullable', 'date'],
            'children.*.birthType' => ['required', 'in:naturel,cesarienne'],

        ];
    }
    public function prepareForValidation()
    {
        $this->merge([
            'doctor_id' => auth()->user()->doctor_id ?? auth()->id(),
            'phone_number' => $this->phoneNumber,
            'allergy' => isset($this->allergy) ? implode(',', $this->allergy) : null,
            'disease' => isset($this->disease) ? implode(',', $this->disease) : null,
            'referral' => isset($this->referral) ? implode(',', $this->referral) : null,
            'children' => isset($this->children) && is_array($this->children) && count($this->children) > 0
                ? $this->children
                : null,
        ]);
    }
    public function messages()
    {
        return [
            'nom.required' => 'Le champ nom est requis.',
            'prenom.required' => 'Le champ prénom est requis.',
            'cin.required' => 'Le champ CIN est requis.',
            'date.required' => 'Le champ date de naissance est requis.',
            'date.date' => 'Le champ date de naissance doit être une date valide.',
            'date.before_or_equal' => 'Le champ date de naissance ne peut pas être dans le futur.',
            'address.required' => "Le champ adresse est requis.",
            'sex.required' => "Le champ sexe est requis.",
            'sex.in' => 'Le champ sexe doit être soit "homme" soit "femme".',
            'phone_number.required' => 'Le champ numéro de téléphone est requis.',
            'phone_number.numeric' => 'Le champ numéro de téléphone doit être numérique.',
            'phone_number.digits_between' => 'Le champ numéro de téléphone doit être composé d\'un nombre de chiffres compris entre :min et :max.',

        ];
    }
}
