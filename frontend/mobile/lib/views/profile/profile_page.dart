import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/auth/auth_state.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('我的'),
      ),
      body: SafeArea(
        child: BlocBuilder<AuthBloc, AuthState>(
          builder: (context, state) {
            if (state is AuthAuthenticated) {
              return _buildProfileContent(context, state);
            }
            return _buildLoginPrompt(context);
          },
        ),
      ),
    );
  }

  Widget _buildProfileContent(BuildContext context, AuthAuthenticated state) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildUserHeader(context, state),
          const SizedBox(height: 24),
          _buildStatsSection(context),
          const SizedBox(height: 24),
          _buildSettingsSection(context),
        ],
      ),
    );
  }

  Widget _buildUserHeader(BuildContext context, AuthAuthenticated state) {
    return Row(
      children: [
        CircleAvatar(
          radius: 40,
          backgroundColor: Theme.of(context).colorScheme.primaryContainer,
          child: Text(
            state.user.name[0].toUpperCase(),
            style: TextStyle(
              fontSize: 24,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                state.user.name,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              Text(
                state.user.email,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey,
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatsSection(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '学习成就',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildAchievementItem(context, '12', '天连续'),
                _buildAchievementItem(context, '48h', '总时长'),
                _buildAchievementItem(context, '156', '练习次数'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAchievementItem(
    BuildContext context,
    String value,
    String label,
  ) {
    return Column(
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Theme.of(context).colorScheme.primary,
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }

  Widget _buildSettingsSection(BuildContext context) {
    return Column(
      children: [
        ListTile(
          leading: const Icon(Icons.settings),
          title: const Text('设置'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () {},
        ),
        ListTile(
          leading: const Icon(Icons.help),
          title: const Text('帮助与反馈'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () {},
        ),
        ListTile(
          leading: const Icon(Icons.logout, color: Colors.red),
          title: const Text('退出登录', style: TextStyle(color: Colors.red)),
          onTap: () {
            context.read<AuthBloc>().add(LogoutRequested());
          },
        ),
      ],
    );
  }

  Widget _buildLoginPrompt(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.account_circle,
            size: 80,
            color: Colors.grey,
          ),
          const SizedBox(height: 16),
          Text(
            '请先登录',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              // Navigate to login page
            },
            child: const Text('登录'),
          ),
        ],
      ),
    );
  }
}
