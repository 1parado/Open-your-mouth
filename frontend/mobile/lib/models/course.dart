class Course {
  const Course({
    required this.id,
    required this.title,
    required this.description,
    required this.level,
    required this.category,
    required this.duration,
    required this.lessons,
  });

  final String id;
  final String title;
  final String description;
  final String level;
  final String category;
  final int duration;
  final List<Lesson> lessons;

  factory Course.fromJson(Map<String, dynamic> json) {
    return Course(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      level: json['level'] as String,
      category: json['category'] as String,
      duration: json['duration'] as int,
      lessons: (json['lessons'] as List<dynamic>)
          .map((lesson) => Lesson.fromJson(lesson as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'level': level,
      'category': category,
      'duration': duration,
      'lessons': lessons.map((lesson) => lesson.toJson()).toList(),
    };
  }
}

class Lesson {
  const Lesson({
    required this.id,
    required this.title,
    required this.content,
    required this.duration,
    required this.order,
  });

  final String id;
  final String title;
  final String content;
  final int duration;
  final int order;

  factory Lesson.fromJson(Map<String, dynamic> json) {
    return Lesson(
      id: json['id'] as String,
      title: json['title'] as String,
      content: json['content'] as String,
      duration: json['duration'] as int,
      order: json['order'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      'duration': duration,
      'order': order,
    };
  }
}
