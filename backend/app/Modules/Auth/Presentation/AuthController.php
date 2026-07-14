<?php

declare(strict_types=1);

namespace App\Modules\Auth\Presentation;

use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Modules\Auth\Application\Services\AuthService;
use App\Modules\Auth\Application\Services\PasswordService;
use App\Modules\Auth\Application\Services\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

final class AuthController extends Controller
{
    public function __construct(private readonly AuthService $auth, private readonly ProfileService $profile, private readonly PasswordService $password) {}

    public function login(LoginRequest $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Login berhasil.', 'data' => $this->auth->login($request->validated(), $request->ip() ?? '0.0.0.0')]);
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Registrasi berhasil.', 'data' => $this->auth->register($request->validated())], 201);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->auth->logout($request->user(), $request->boolean('all_devices'));
        return response()->json(['success' => true, 'message' => 'Logout berhasil.', 'data' => []]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => $this->password->forgot($request->validated()), 'data' => []]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => $this->password->reset($request->validated()), 'data' => []]);
    }

    public function profile(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Profile berhasil diambil.', 'data' => $this->profile->show($request->user())]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Profile berhasil diperbarui.', 'data' => $this->profile->update($request->user(), $request->validated(), $request->file('avatar'))]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $this->password->change($request->user(), $request->validated('password'));
        return response()->json(['success' => true, 'message' => 'Password berhasil diubah.', 'data' => []]);
    }

    public function refresh(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Token berhasil diperbarui.', 'data' => $this->auth->refresh($request->user())]);
    }
}
