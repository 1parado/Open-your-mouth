import 'package:flutter/material.dart';

class CoursesPage extends StatelessWidget {
  const CoursesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('课程'),
      ),
      body: SafeArea(
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: 6,
          itemBuilder: (context, index) {
            return _buildCourseCard(context, index);
          },
        ),
      ),
    );
  }

  Widget _buildCourseCard(BuildContext context, int index) {
    final courses = [
      {'title': '初级英语口语', 'level': '初级', 'lessons': '12课'},
      {'title': '商务英语进阶', 'level': '中级', 'lessons': '16课'},
      {'title': '旅游英语大全', 'level': '中级', 'lessons': '10课'},
      {'title': '雅思口语突破', 'level': '高级', 'lessons': '20课'},
      {'title': '日常对话技巧', 'level': '初级', 'lessons': '8课'},
      {'title': '学术英语写作', 'level': '高级', 'lessons': '14课'},
    ];

    final course = courses[index];
    final levelColor = _getLevelColor(course['level']!);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          // Navigate to course detail
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: levelColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      course['level']!,
                      style: TextStyle(
                        color: levelColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    course['lessons']!,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                course['title']!,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value: index * 0.15,
                backgroundColor: Colors.grey[200],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getLevelColor(String level) {
    switch (level) {
      case '初级':
        return Colors.green;
      case '中级':
        return Colors.orange;
      case '高级':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }
}
