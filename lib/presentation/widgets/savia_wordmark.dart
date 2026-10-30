import 'package:flutter/material.dart';

import '../../core/app_theme.dart';

class SaviaWordmark extends StatelessWidget {
  const SaviaWordmark({
    super.key,
    this.name = 'Savia',
    this.size = 42,
    this.color = AppColors.ink,
  });

  final String name;
  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) => Text(
    name.toLowerCase(),
    semanticsLabel: name,
    style: TextStyle(
      fontFamily: 'Inter',
      color: color,
      fontSize: size,
      height: 1.1,
      letterSpacing: -size * .055,
      fontWeight: FontWeight.w800,
    ),
  );
}
