import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'services/injection.dart';
import 'blocs/auth/auth_bloc.dart';
import 'views/home/home_page.dart';
import 'utils/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load();
  configureDependencies();
  runApp(const AiOralTeacherApp());
}

class AiOralTeacherApp extends StatelessWidget {
  const AiOralTeacherApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (_) => getIt<AuthBloc>(),
        ),
      ],
      child: MaterialApp(
        title: 'AI Oral Teacher',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        home: const HomePage(),
      ),
    );
  }
}
