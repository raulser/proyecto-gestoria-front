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
  Widget build(BuildContext context) {
    if (name.trim().toLowerCase() != 'savia') {
      return Text(
        name,
        style: TextStyle(
          fontFamily: 'Inter',
          color: color,
          fontSize: size,
          height: 1.1,
          letterSpacing: -size * .025,
          fontWeight: FontWeight.w600,
        ),
      );
    }
    final light = color.computeLuminance() > .5;
    return Image.asset(
      light
          ? 'assets/brand/savia-logo-light.png'
          : 'assets/brand/savia-logo.png',
      width: size * 3.5,
      height: size,
      fit: BoxFit.contain,
      alignment: Alignment.centerLeft,
      filterQuality: FilterQuality.high,
      semanticLabel: 'Savia',
    );
  }
}
