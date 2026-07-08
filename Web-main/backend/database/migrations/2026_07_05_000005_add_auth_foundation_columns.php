<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->timestamp('last_login_at')->nullable()->after('remember_token');
            $table->string('avatar_path')->nullable()->after('last_login_at');
            $table->boolean('is_active')->default(true)->index()->after('avatar_path');
        });
        Schema::create('password_reset_tokens', function (Blueprint $table): void {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('password_reset_tokens');
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['last_login_at', 'avatar_path', 'is_active']);
        });
    }
};
