import 'package:get_it/get_it.dart';
import '../blocs/auth/auth_bloc.dart';

final GetIt getIt = GetIt.instance;

void configureDependencies() {
  if (!getIt.isRegistered<AuthBloc>()) {
    getIt.registerFactory<AuthBloc>(() => AuthBloc());
  }
}
