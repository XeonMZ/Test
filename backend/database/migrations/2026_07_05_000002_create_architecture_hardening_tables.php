<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('key')->unique();
            $table->json('value');
            $table->boolean('is_public')->default(false);
            $table->timestamps();
        });

        Schema::create('feature_flags', function (Blueprint $table): void {
            $table->id();
            $table->string('key')->unique();
            $table->boolean('enabled')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_trails', function (Blueprint $table): void {
            $table->id();
            $table->string('action');
            $table->string('subject');
            $table->string('actor_type')->nullable();
            $table->uuid('actor_uuid')->nullable();
            $table->string('correlation_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_trails');
        Schema::dropIfExists('feature_flags');
        Schema::dropIfExists('system_settings');
    }
};
