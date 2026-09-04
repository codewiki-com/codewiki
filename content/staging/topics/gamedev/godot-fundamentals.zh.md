---
title: Godot 游戏开发基础
description: 掌握Godot引擎核心概念：场景树、节点系统、GDScript和信号机制
track: gamedev
section: godot
difficulty: beginner
tags:
  - Godot
  - GDScript
  - 游戏引擎
  - 开源
status: imported
origin: old/src/content/docs/gamedev/godot-fundamentals.zh.md
divergence: 0.263
issues: []
legacy:
  category: GameDev
  subcategory: Godot
  order: 9
  lastUpdated: 2026-01-07
---

Godot 是一款功能强大的开源游戏引擎，支持 2D 和 3D 游戏开发。它以其独特的场景-节点架构、简洁的 GDScript 语言和完全免费开源的特性，成为独立游戏开发者和学习者的理想选择。本文将深入探讨 Godot 引擎的核心概念和开发实践。

## Godot 编辑器概览

### 编辑器界面

Godot 编辑器采用模块化设计，主要包含以下区域：

1. **场景面板（Scene）**：显示当前场景的节点树结构
2. **文件系统（FileSystem）**：项目资源文件浏览器
3. **检查器（Inspector）**：选中节点的属性编辑面板
4. **视口（Viewport）**：2D/3D 场景预览和编辑区域
5. **脚本编辑器**：内置代码编辑器，支持语法高亮和自动补全

### 项目结构

典型的 Godot 项目结构如下：

```
my_game/
├── project.godot          # 项目配置文件
├── icon.svg               # 项目图标
├── scenes/                # 场景文件目录
│   ├── main.tscn          # 主场景
│   ├── player.tscn        # 玩家场景
│   └── enemy.tscn         # 敌人场景
├── scripts/               # 脚本文件目录
│   ├── player.gd          # 玩家脚本
│   └── enemy.gd           # 敌人脚本
├── assets/                # 资源文件目录
│   ├── sprites/           # 精灵图片
│   ├── audio/             # 音频文件
│   └── fonts/             # 字体文件
└── addons/                # 插件目录
```

### 创建第一个项目

1. 启动 Godot，点击"新建项目"
2. 选择项目路径并命名
3. 选择渲染器（Forward+ 适合 3D，Mobile 适合移动端，Compatibility 兼容性最好）
4. 点击"创建并编辑"

## 场景和节点

### 节点（Node）概念

节点是 Godot 中最基本的构建块。每个节点都有：

- **名称**：在场景树中的标识
- **属性**：可配置的参数
- **方法**：可调用的函数
- **信号**：可发送的事件通知

### 常用节点类型

**基础节点**：

| 节点类型 | 用途 |
|---------|------|
| Node | 最基础的节点，用于组织和分组 |
| Node2D | 2D 游戏对象的基类 |
| Node3D | 3D 游戏对象的基类 |
| Control | UI 元素的基类 |

**2D 常用节点**：

| 节点类型 | 用途 |
|---------|------|
| Sprite2D | 显示 2D 图像 |
| AnimatedSprite2D | 播放帧动画 |
| CharacterBody2D | 角色物理控制 |
| RigidBody2D | 刚体物理模拟 |
| Area2D | 区域检测 |
| CollisionShape2D | 碰撞形状 |
| TileMap | 瓦片地图 |
| Camera2D | 2D 摄像机 |

**3D 常用节点**：

| 节点类型 | 用途 |
|---------|------|
| MeshInstance3D | 显示 3D 网格 |
| CharacterBody3D | 3D 角色物理控制 |
| RigidBody3D | 3D 刚体物理模拟 |
| Area3D | 3D 区域检测 |
| Camera3D | 3D 摄像机 |
| DirectionalLight3D | 平行光源 |

### 场景树（Scene Tree）

场景树是节点的层级组织结构。子节点会继承父节点的变换（位置、旋转、缩放）：

```
Main (Node2D)
├── Player (CharacterBody2D)
│   ├── Sprite2D
│   ├── CollisionShape2D
│   └── AnimationPlayer
├── Enemies (Node2D)
│   ├── Enemy1 (CharacterBody2D)
│   └── Enemy2 (CharacterBody2D)
├── UI (CanvasLayer)
│   ├── ScoreLabel (Label)
│   └── HealthBar (ProgressBar)
└── TileMap
```

### 场景的组合与实例化

Godot 鼓励将游戏分解为可复用的场景。一个场景可以被实例化到另一个场景中：

```gdscript
extends Node2D

# 预加载场景资源
var EnemyScene = preload("res://scenes/enemy.tscn")

func spawn_enemy():
    # 实例化场景
    var enemy = EnemyScene.instantiate()
    # 设置位置
    enemy.position = Vector2(100, 200)
    # 添加到场景树
    add_child(enemy)

func remove_enemy(enemy):
    # 从场景树中移除并释放
    enemy.queue_free()
```

## GDScript 语法详解

GDScript 是 Godot 的主要脚本语言，语法类似 Python，但专为游戏开发优化。

### 基础语法

```gdscript
extends Node2D  # 继承自 Node2D

# 类名（可选）
class_name Player

# 导出变量（在检查器中可编辑）
@export var speed: float = 200.0
@export var max_health: int = 100
@export_range(0, 100) var damage: int = 10

# 普通变量
var velocity: Vector2 = Vector2.ZERO
var is_alive: bool = true
var items: Array = []
var stats: Dictionary = {"level": 1, "exp": 0}

# 常量
const MAX_SPEED = 500.0
const GRAVITY = 980.0

# onready 变量（场景准备好后初始化）
@onready var sprite = $Sprite2D
@onready var animation_player = $AnimationPlayer
```

### 函数定义

```gdscript
# 基本函数
func calculate_damage(base_damage: int, multiplier: float) -> int:
    return int(base_damage * multiplier)

# 带默认参数的函数
func move_to(target: Vector2, speed: float = 100.0) -> void:
    var direction = (target - position).normalized()
    position += direction * speed * get_process_delta_time()

# 静态函数
static func clamp_value(value: float, min_val: float, max_val: float) -> float:
    return clamp(value, min_val, max_val)
```

### 内置回调函数

Godot 提供了多个生命周期回调函数：

```gdscript
extends CharacterBody2D

# 节点进入场景树时调用（只调用一次）
func _ready():
    print("节点已准备就绪")
    # 初始化逻辑

# 每帧调用（用于游戏逻辑）
func _process(delta: float):
    # delta 是距离上一帧的时间（秒）
    rotate(delta * 2.0)  # 每秒旋转 2 弧度

# 固定时间间隔调用（用于物理计算，默认 60 次/秒）
func _physics_process(delta: float):
    # 物理相关的移动和碰撞检测
    velocity.y += GRAVITY * delta
    move_and_slide()

# 接收输入事件
func _input(event: InputEvent):
    if event is InputEventKey and event.pressed:
        if event.keycode == KEY_SPACE:
            jump()

# 未处理的输入事件
func _unhandled_input(event: InputEvent):
    if event.is_action_pressed("ui_cancel"):
        get_tree().quit()

# 节点即将从场景树移除时调用
func _exit_tree():
    print("节点即将移除")
```

### 条件和循环

```gdscript
# 条件语句
func check_health(health: int) -> String:
    if health <= 0:
        return "死亡"
    elif health < 30:
        return "危险"
    elif health < 70:
        return "正常"
    else:
        return "健康"

# match 语句（类似 switch）
func handle_state(state: String):
    match state:
        "idle":
            play_idle_animation()
        "walk", "run":  # 多个值匹配
            play_move_animation()
        "attack":
            play_attack_animation()
        _:  # 默认情况
            print("未知状态")

# for 循环
func process_enemies(enemies: Array):
    for enemy in enemies:
        enemy.update()

    # 带索引的循环
    for i in range(len(enemies)):
        print("敌人 %d: %s" % [i, enemies[i].name])

    # range 循环
    for i in range(10):  # 0 到 9
        print(i)

    for i in range(5, 10):  # 5 到 9
        print(i)

    for i in range(0, 10, 2):  # 0, 2, 4, 6, 8
        print(i)

# while 循环
func wait_for_player():
    var timeout = 10.0
    while timeout > 0:
        if player_connected:
            break
        timeout -= get_process_delta_time()
        await get_tree().process_frame
```

### 类和继承

```gdscript
# base_enemy.gd
extends CharacterBody2D
class_name BaseEnemy

@export var max_health: int = 100
@export var move_speed: float = 50.0

var current_health: int

func _ready():
    current_health = max_health

func take_damage(amount: int):
    current_health -= amount
    if current_health <= 0:
        die()

func die():
    queue_free()

# 虚函数，子类可以重写
func attack():
    pass
```

```gdscript
# slime.gd - 继承自 BaseEnemy
extends BaseEnemy
class_name Slime

@export var jump_force: float = 300.0

func _ready():
    super._ready()  # 调用父类的 _ready
    max_health = 50  # 覆盖父类属性

func attack():
    # 实现具体的攻击逻辑
    print("史莱姆跳跃攻击！")
    velocity.y = -jump_force

func die():
    # 史莱姆死亡时分裂
    spawn_mini_slimes()
    super.die()  # 调用父类的 die

func spawn_mini_slimes():
    for i in range(2):
        var mini = MiniSlimeScene.instantiate()
        mini.position = position + Vector2(randf_range(-20, 20), 0)
        get_parent().add_child(mini)
```

## 信号系统

信号是 Godot 中实现对象间通信的核心机制，遵循观察者模式。

### 定义和发送信号

```gdscript
extends CharacterBody2D

# 定义信号
signal health_changed(new_health: int, max_health: int)
signal died
signal item_collected(item_name: String, quantity: int)

# 带参数的信号定义
signal shoot(bullet: PackedScene, direction: float, position: Vector2)

var health: int = 100
var max_health: int = 100

func take_damage(amount: int):
    health -= amount
    # 发送信号
    health_changed.emit(health, max_health)

    if health <= 0:
        died.emit()
```

### 连接信号

**方式一：在编辑器中连接**

1. 选择发送信号的节点
2. 在检查器中切换到"节点"选项卡
3. 双击要连接的信号
4. 选择目标节点和方法

**方式二：通过代码连接**

```gdscript
extends Node

@onready var player = $Player
@onready var health_bar = $UI/HealthBar
@onready var game_over_screen = $UI/GameOverScreen

func _ready():
    # 连接信号到方法
    player.health_changed.connect(_on_player_health_changed)
    player.died.connect(_on_player_died)

    # 使用 Lambda 表达式
    player.item_collected.connect(func(item, qty):
        print("获得了 %d 个 %s" % [qty, item])
    )

    # 一次性连接（触发后自动断开）
    player.died.connect(_on_player_died_once, CONNECT_ONE_SHOT)

func _on_player_health_changed(new_health: int, max_health: int):
    health_bar.value = float(new_health) / max_health * 100

func _on_player_died():
    game_over_screen.show()
    get_tree().paused = true

func _on_player_died_once():
    print("玩家第一次死亡！")
```

### 使用信号实现解耦

信号机制可以让对象之间保持松耦合：

```gdscript
# player.gd - 玩家脚本
extends Sprite2D

signal shoot(bullet: PackedScene, direction: float, location: Vector2)

var Bullet = preload("res://scenes/bullet.tscn")

func _input(event):
    if event is InputEventMouseButton:
        if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
            # 发送射击信号，不直接创建子弹
            shoot.emit(Bullet, rotation, position)

func _process(delta):
    look_at(get_global_mouse_position())
```

```gdscript
# main.gd - 主场景脚本
extends Node2D

@onready var player = $Player

func _ready():
    player.shoot.connect(_on_player_shoot)

func _on_player_shoot(Bullet: PackedScene, direction: float, location: Vector2):
    # 在主场景中处理子弹创建
    var spawned_bullet = Bullet.instantiate()
    add_child(spawned_bullet)
    spawned_bullet.rotation = direction
    spawned_bullet.position = location
    spawned_bullet.velocity = spawned_bullet.velocity.rotated(direction)
```

这种模式的优点是玩家脚本不需要知道子弹如何被管理，主场景可以自由决定如何处理子弹。

## 资源管理

### 资源类型

Godot 中的资源（Resource）是可复用的数据容器：

| 资源类型 | 文件扩展名 | 用途 |
|---------|-----------|------|
| Texture2D | .png, .jpg, .svg | 2D 纹理图像 |
| AudioStream | .wav, .ogg, .mp3 | 音频文件 |
| PackedScene | .tscn | 场景文件 |
| Script | .gd | GDScript 脚本 |
| Shader | .gdshader | 着色器 |
| Font | .ttf, .otf | 字体文件 |
| Animation | .tres | 动画资源 |

### 加载资源

```gdscript
# 预加载（编译时加载，适合常用资源）
var BulletScene = preload("res://scenes/bullet.tscn")
var PlayerSprite = preload("res://assets/sprites/player.png")

# 动态加载（运行时加载，适合可选资源）
func load_level(level_name: String):
    var level_path = "res://scenes/levels/%s.tscn" % level_name
    var level_scene = load(level_path)
    if level_scene:
        var level = level_scene.instantiate()
        add_child(level)

# 异步加载（避免卡顿）
func load_level_async(level_name: String):
    var level_path = "res://scenes/levels/%s.tscn" % level_name
    ResourceLoader.load_threaded_request(level_path)

    # 在其他地方检查加载状态
    var status = ResourceLoader.load_threaded_get_status(level_path)
    if status == ResourceLoader.THREAD_LOAD_LOADED:
        var level_scene = ResourceLoader.load_threaded_get(level_path)
        var level = level_scene.instantiate()
        add_child(level)
```

### 自定义资源

```gdscript
# weapon_data.gd
extends Resource
class_name WeaponData

@export var name: String = ""
@export var damage: int = 10
@export var fire_rate: float = 0.5
@export var bullet_speed: float = 500.0
@export var sprite: Texture2D
@export var fire_sound: AudioStream
```

使用自定义资源：

```gdscript
# weapon.gd
extends Node2D

@export var weapon_data: WeaponData

var can_fire: bool = true

func _ready():
    $Sprite2D.texture = weapon_data.sprite

func fire():
    if can_fire:
        can_fire = false
        var bullet = BulletScene.instantiate()
        bullet.damage = weapon_data.damage
        bullet.speed = weapon_data.bullet_speed
        get_parent().add_child(bullet)

        $AudioStreamPlayer.stream = weapon_data.fire_sound
        $AudioStreamPlayer.play()

        await get_tree().create_timer(weapon_data.fire_rate).timeout
        can_fire = true
```

## 2D 游戏开发

### 角色控制

```gdscript
extends CharacterBody2D

@export var speed: float = 300.0
@export var jump_velocity: float = -400.0
@export var gravity: float = 980.0

func _physics_process(delta):
    # 应用重力
    if not is_on_floor():
        velocity.y += gravity * delta

    # 跳跃
    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = jump_velocity

    # 水平移动
    var direction = Input.get_axis("move_left", "move_right")
    if direction:
        velocity.x = direction * speed
    else:
        velocity.x = move_toward(velocity.x, 0, speed)

    move_and_slide()

    # 更新动画
    update_animation(direction)

func update_animation(direction: float):
    if not is_on_floor():
        $AnimatedSprite2D.play("jump")
    elif direction != 0:
        $AnimatedSprite2D.play("walk")
        $AnimatedSprite2D.flip_h = direction < 0
    else:
        $AnimatedSprite2D.play("idle")
```

### 碰撞检测

```gdscript
extends Area2D

signal collected(value: int)

@export var coin_value: int = 10

func _ready():
    # 连接信号
    body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D):
    if body.is_in_group("player"):
        collected.emit(coin_value)
        # 播放收集动画后删除
        $AnimationPlayer.play("collect")
        await $AnimationPlayer.animation_finished
        queue_free()
```

### 瓦片地图（TileMap）

```gdscript
extends TileMap

# 在代码中设置瓦片
func set_tile_at(coords: Vector2i, tile_id: int):
    set_cell(0, coords, 0, Vector2i(tile_id, 0))

# 获取指定位置的瓦片
func get_tile_at(coords: Vector2i) -> int:
    return get_cell_source_id(0, coords)

# 世界坐标转瓦片坐标
func world_to_tile(world_pos: Vector2) -> Vector2i:
    return local_to_map(world_pos)

# 瓦片坐标转世界坐标
func tile_to_world(tile_pos: Vector2i) -> Vector2:
    return map_to_local(tile_pos)
```

### 摄像机跟随

```gdscript
extends Camera2D

@export var target: Node2D
@export var smoothing: float = 5.0
@export var look_ahead: float = 50.0

func _process(delta):
    if target:
        var target_pos = target.global_position

        # 添加前视偏移
        if target.has_method("get_facing_direction"):
            target_pos.x += target.get_facing_direction() * look_ahead

        # 平滑跟随
        global_position = global_position.lerp(target_pos, smoothing * delta)
```

## 3D 游戏开发

### 3D 角色控制

```gdscript
extends CharacterBody3D

@export var speed: float = 5.0
@export var jump_velocity: float = 4.5
@export var mouse_sensitivity: float = 0.002

var gravity = ProjectSettings.get_setting("physics/3d/default_gravity")

func _ready():
    Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

func _input(event):
    if event is InputEventMouseMotion:
        rotate_y(-event.relative.x * mouse_sensitivity)
        $Camera3D.rotate_x(-event.relative.y * mouse_sensitivity)
        $Camera3D.rotation.x = clamp($Camera3D.rotation.x, -PI/2, PI/2)

    if event.is_action_pressed("ui_cancel"):
        Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)

func _physics_process(delta):
    # 应用重力
    if not is_on_floor():
        velocity.y -= gravity * delta

    # 跳跃
    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = jump_velocity

    # 获取输入方向
    var input_dir = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
    var direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

    if direction:
        velocity.x = direction.x * speed
        velocity.z = direction.z * speed
    else:
        velocity.x = move_toward(velocity.x, 0, speed)
        velocity.z = move_toward(velocity.z, 0, speed)

    move_and_slide()
```

### 3D 敌人基础

```gdscript
extends CharacterBody3D
class_name Enemy3D

@export var min_speed: float = 10.0
@export var max_speed: float = 18.0

signal squashed

var speed: float

func _ready():
    speed = randf_range(min_speed, max_speed)

func _physics_process(delta):
    move_and_slide()

func initialize(start_position: Vector3, target_position: Vector3):
    position = start_position
    look_at(target_position, Vector3.UP)
    velocity = -transform.basis.z * speed

func squash():
    squashed.emit()
    queue_free()
```

## 输入处理

### 输入映射配置

在项目设置中配置输入映射（Project -> Project Settings -> Input Map）：

```gdscript
# 检查输入动作
func _process(delta):
    # 按下瞬间
    if Input.is_action_just_pressed("attack"):
        attack()

    # 持续按住
    if Input.is_action_pressed("run"):
        speed = run_speed

    # 释放瞬间
    if Input.is_action_just_released("run"):
        speed = walk_speed

    # 获取轴向值（-1 到 1）
    var horizontal = Input.get_axis("move_left", "move_right")
    var vertical = Input.get_axis("move_up", "move_down")
    var direction = Vector2(horizontal, vertical).normalized()
```

### 处理不同输入设备

```gdscript
func _input(event):
    # 键盘输入
    if event is InputEventKey:
        if event.keycode == KEY_ESCAPE and event.pressed:
            toggle_pause()

    # 鼠标按钮
    if event is InputEventMouseButton:
        if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
            fire()

    # 鼠标移动
    if event is InputEventMouseMotion:
        aim_direction = event.position

    # 手柄按钮
    if event is InputEventJoypadButton:
        if event.button_index == JOY_BUTTON_A and event.pressed:
            jump()

    # 手柄摇杆
    if event is InputEventJoypadMotion:
        if event.axis == JOY_AXIS_LEFT_X:
            horizontal_input = event.axis_value
```

## 动画系统

### AnimationPlayer

```gdscript
extends CharacterBody2D

@onready var anim_player = $AnimationPlayer

func _ready():
    # 连接动画结束信号
    anim_player.animation_finished.connect(_on_animation_finished)

func play_animation(anim_name: String):
    if anim_player.has_animation(anim_name):
        anim_player.play(anim_name)

func _on_animation_finished(anim_name: StringName):
    match anim_name:
        "attack":
            play_animation("idle")
        "death":
            queue_free()
```

### AnimatedSprite2D

```gdscript
extends CharacterBody2D

@onready var sprite = $AnimatedSprite2D

func _ready():
    sprite.animation_finished.connect(_on_animation_finished)

func update_animation():
    if velocity.length() > 0:
        sprite.play("walk")
        sprite.flip_h = velocity.x < 0
    else:
        sprite.play("idle")

func play_attack():
    sprite.play("attack")
    await sprite.animation_finished
    update_animation()
```

### 补间动画（Tween）

```gdscript
extends Node2D

func fade_out():
    var tween = create_tween()
    tween.tween_property(self, "modulate:a", 0.0, 1.0)
    await tween.finished
    queue_free()

func bounce():
    var tween = create_tween()
    tween.set_loops(3)  # 循环 3 次
    tween.tween_property(self, "scale", Vector2(1.2, 0.8), 0.1)
    tween.tween_property(self, "scale", Vector2(0.8, 1.2), 0.1)
    tween.tween_property(self, "scale", Vector2.ONE, 0.1)

func move_along_path(points: Array[Vector2]):
    var tween = create_tween()
    for point in points:
        tween.tween_property(self, "position", point, 0.5)

func complex_animation():
    var tween = create_tween()
    tween.set_parallel(true)  # 并行执行
    tween.tween_property(self, "position:x", 500, 1.0)
    tween.tween_property(self, "rotation", TAU, 1.0)
    tween.tween_property(self, "modulate", Color.RED, 1.0)
```

## 音频系统

### 播放音效

```gdscript
extends Node2D

@onready var audio_player = $AudioStreamPlayer2D
@export var jump_sound: AudioStream
@export var hurt_sound: AudioStream
@export var coin_sound: AudioStream

func play_sound(sound: AudioStream):
    audio_player.stream = sound
    audio_player.play()

func jump():
    play_sound(jump_sound)
    # 跳跃逻辑

func take_damage():
    play_sound(hurt_sound)
    # 受伤逻辑
```

### 音频总线管理

```gdscript
extends Node

func set_master_volume(value: float):
    var bus_idx = AudioServer.get_bus_index("Master")
    AudioServer.set_bus_volume_db(bus_idx, linear_to_db(value))

func set_music_volume(value: float):
    var bus_idx = AudioServer.get_bus_index("Music")
    AudioServer.set_bus_volume_db(bus_idx, linear_to_db(value))

func set_sfx_volume(value: float):
    var bus_idx = AudioServer.get_bus_index("SFX")
    AudioServer.set_bus_volume_db(bus_idx, linear_to_db(value))

func mute_bus(bus_name: String, mute: bool):
    var bus_idx = AudioServer.get_bus_index(bus_name)
    AudioServer.set_bus_mute(bus_idx, mute)
```

## UI 开发

### Control 节点

```gdscript
extends Control

@onready var health_bar = $HealthBar
@onready var score_label = $ScoreLabel
@onready var pause_menu = $PauseMenu

func _ready():
    pause_menu.hide()

func update_health(current: int, maximum: int):
    health_bar.max_value = maximum
    health_bar.value = current

func update_score(score: int):
    score_label.text = "分数: %d" % score

func _input(event):
    if event.is_action_pressed("pause"):
        toggle_pause()

func toggle_pause():
    var paused = not get_tree().paused
    get_tree().paused = paused
    pause_menu.visible = paused
```

### 响应式 UI 布局

```gdscript
extends Control

func _ready():
    # 设置锚点使 UI 响应窗口大小变化
    anchor_left = 0.0
    anchor_top = 0.0
    anchor_right = 1.0
    anchor_bottom = 1.0

    # 连接窗口大小变化信号
    get_viewport().size_changed.connect(_on_viewport_size_changed)

func _on_viewport_size_changed():
    # 根据新窗口大小调整 UI
    var viewport_size = get_viewport().get_visible_rect().size
    # 自定义调整逻辑
```

## 导出项目

### 配置导出

1. 打开 Editor -> Manage Export Templates，下载导出模板
2. 打开 Project -> Export
3. 添加目标平台预设
4. 配置导出选项

### 支持的平台

| 平台 | 说明 |
|------|------|
| Windows | 导出 .exe 文件 |
| Linux | 导出可执行文件 |
| macOS | 导出 .app 或 .dmg |
| Android | 导出 .apk 或 .aab |
| iOS | 需要 macOS 和 Xcode |
| Web | 导出 HTML5 版本 |

### 导出最佳实践

```gdscript
# 检测运行平台
func _ready():
    if OS.has_feature("mobile"):
        # 移动端特定设置
        setup_mobile_controls()
    elif OS.has_feature("web"):
        # Web 平台特定设置
        setup_web_platform()
    else:
        # 桌面端设置
        setup_desktop_controls()

func setup_mobile_controls():
    $TouchControls.show()
    $KeyboardHint.hide()

func setup_desktop_controls():
    $TouchControls.hide()
    $KeyboardHint.show()
```

### 分享游戏

导出完成后：
1. 将可执行文件和 .pck 文件打包成 ZIP
2. 上传到 itch.io、Game Jolt 等平台
3. 或直接发送给朋友测试

## 调试技巧

### 打印调试

```gdscript
# 基本打印
print("调试信息")

# 格式化打印
print("玩家位置: %s, 生命值: %d" % [position, health])

# 打印错误
printerr("发生错误：无法加载资源")

# 打印警告
push_warning("警告：配置文件缺失，使用默认值")

# 打印并中断（调试用）
assert(health > 0, "生命值不能为负数")
```

### 使用调试器

```gdscript
# 设置断点
func complex_calculation():
    var result = 0
    breakpoint  # 代码执行到此处会暂停
    for i in range(100):
        result += i
    return result
```

### 可视化调试

```gdscript
extends CharacterBody2D

func _draw():
    # 绘制速度向量
    draw_line(Vector2.ZERO, velocity * 0.1, Color.RED, 2)
    # 绘制检测范围
    draw_circle(Vector2.ZERO, detection_radius, Color(0, 1, 0, 0.3))

func _process(delta):
    queue_redraw()  # 每帧更新绘制
```

## 常见问题与解决方案

### 节点路径问题

```gdscript
# 问题：硬编码路径容易出错
var player = get_node("/root/Main/World/Player")

# 解决方案 1：使用 @onready
@onready var player = $Player

# 解决方案 2：使用分组
func find_player():
    var players = get_tree().get_nodes_in_group("player")
    if players.size() > 0:
        return players[0]
    return null

# 解决方案 3：使用自动加载（单例）
# 在项目设置中配置后
var player = GameManager.player
```

### 内存管理

```gdscript
# 正确释放节点
func remove_enemy(enemy):
    enemy.queue_free()  # 推荐：安全地在帧结束时释放

# 避免内存泄漏
func _exit_tree():
    # 清理资源
    for child in get_children():
        child.queue_free()
```

### 性能优化

```gdscript
# 减少 get_node 调用
# 不推荐
func _process(delta):
    $Sprite2D.rotation += delta  # 每帧调用 get_node

# 推荐
@onready var sprite = $Sprite2D
func _process(delta):
    sprite.rotation += delta

# 使用对象池
class_name BulletPool

var pool: Array[Bullet] = []
var BulletScene = preload("res://bullet.tscn")

func get_bullet() -> Bullet:
    for bullet in pool:
        if not bullet.active:
            bullet.activate()
            return bullet

    var new_bullet = BulletScene.instantiate()
    pool.append(new_bullet)
    add_child(new_bullet)
    return new_bullet
```

## 进阶主题

### 自动加载（单例模式）

在项目设置中配置自动加载脚本：

```gdscript
# game_manager.gd
extends Node

signal game_paused
signal game_resumed

var score: int = 0
var high_score: int = 0
var current_level: int = 1

func add_score(points: int):
    score += points
    if score > high_score:
        high_score = score

func reset_game():
    score = 0
    current_level = 1

func save_game():
    var save_data = {
        "high_score": high_score,
        "current_level": current_level
    }
    var file = FileAccess.open("user://save.json", FileAccess.WRITE)
    file.store_string(JSON.stringify(save_data))

func load_game():
    if FileAccess.file_exists("user://save.json"):
        var file = FileAccess.open("user://save.json", FileAccess.READ)
        var data = JSON.parse_string(file.get_as_text())
        high_score = data.get("high_score", 0)
        current_level = data.get("current_level", 1)
```

### 存档系统

```gdscript
extends Node

const SAVE_PATH = "user://game_save.json"

func save_game(data: Dictionary) -> bool:
    var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
    if file == null:
        printerr("无法打开存档文件")
        return false

    var json_string = JSON.stringify(data, "\t")
    file.store_string(json_string)
    file.close()
    return true

func load_game() -> Dictionary:
    if not FileAccess.file_exists(SAVE_PATH):
        return {}

    var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
    if file == null:
        return {}

    var json_string = file.get_as_text()
    file.close()

    var json = JSON.new()
    var error = json.parse(json_string)
    if error != OK:
        printerr("存档文件解析错误")
        return {}

    return json.data

func delete_save():
    if FileAccess.file_exists(SAVE_PATH):
        DirAccess.remove_absolute(SAVE_PATH)
```

### 状态机模式

```gdscript
# state_machine.gd
extends Node
class_name StateMachine

var current_state: State
var states: Dictionary = {}

func _ready():
    for child in get_children():
        if child is State:
            states[child.name.to_lower()] = child
            child.state_machine = self

func change_state(new_state_name: String):
    if current_state:
        current_state.exit()

    current_state = states.get(new_state_name.to_lower())
    if current_state:
        current_state.enter()

func _process(delta):
    if current_state:
        current_state.update(delta)

func _physics_process(delta):
    if current_state:
        current_state.physics_update(delta)
```

```gdscript
# state.gd
extends Node
class_name State

var state_machine: StateMachine

func enter():
    pass

func exit():
    pass

func update(delta: float):
    pass

func physics_update(delta: float):
    pass
```

```gdscript
# idle_state.gd
extends State

func enter():
    owner.animation_player.play("idle")

func update(delta):
    if Input.is_action_pressed("move_left") or Input.is_action_pressed("move_right"):
        state_machine.change_state("walk")

    if Input.is_action_just_pressed("jump"):
        state_machine.change_state("jump")
```

## 学习资源

### 官方资源

- **官方文档**：https://docs.godotengine.org
- **官方教程**：涵盖 2D 和 3D 游戏开发入门
- **资源库**：https://godotengine.org/asset-library

### 社区资源

- **GDQuest**：高质量 Godot 教程
- **KidsCanCode**：适合初学者的教程
- **Godot 中文社区**：中文学习资源

### 推荐学习路径

1. **入门阶段**
   - 完成官方 2D 游戏教程
   - 理解场景和节点概念
   - 掌握 GDScript 基础语法

2. **进阶阶段**
   - 学习信号和自定义资源
   - 实现完整的小游戏
   - 了解性能优化技巧

3. **高级阶段**
   - 学习着色器编程
   - 掌握 C# 或 GDExtension
   - 发布游戏到各平台

## 总结

Godot 引擎以其独特的场景-节点架构、简洁的 GDScript 语言和完全开源免费的特性，为游戏开发者提供了一个强大而灵活的开发平台。通过本文的学习，你应该掌握了：

1. Godot 编辑器的基本使用和项目结构
2. 场景树和节点系统的核心概念
3. GDScript 语言的语法和常用模式
4. 信号机制实现对象间通信
5. 2D 和 3D 游戏开发的基础知识
6. 资源管理和音频系统
7. UI 开发和项目导出

Godot 的学习曲线相对平缓，但要精通它需要大量实践。建议从简单的小游戏开始，逐步挑战更复杂的项目。最重要的是，享受创造游戏的乐趣！
