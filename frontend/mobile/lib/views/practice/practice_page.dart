import 'package:flutter/material.dart';

class PracticePage extends StatelessWidget {
  const PracticePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('口语练习'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              _buildMicrophoneCard(context),
              const SizedBox(height: 16),
              _buildTopicList(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMicrophoneCard(BuildContext context) {
    return Card(
      child: Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primaryContainer,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.mic,
                size: 40,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '点击开始练习',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              '与AI进行实时对话练习',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopicList() {
    return Expanded(
      child: ListView.builder(
        itemCount: 5,
        itemBuilder: (context, index) {
          final topics = [
            '日常对话',
            '商务英语',
            '旅游英语',
            '学术讨论',
            '面试技巧',
          ];
          return ListTile(
            leading: const Icon(Icons.chat_bubble_outline),
            title: Text(topics[index]),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              // Navigate to topic practice
            },
          );
        },
      ),
    );
  }
}
